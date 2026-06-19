import { getSupabaseAdmin } from '@/lib/server/supabase-admin'
import { isModuleComplete } from '@/lib/server/module-completion'
import { queuePayoutForSingleModule, syncPayoutJobsForUser } from '@/lib/server/reward-payout-queue'
import { processPayoutJobNow, type InstantPayoutResult } from '@/lib/server/reward-payout-worker'

type MilestoneNumber = 1 | 2 | 3

type MilestoneStatus = 'locked' | 'eligible' | 'queued' | 'processing' | 'paid' | 'failed' | 'canceled'

const XP_PER_COMPLETED_MODULE = 500

type RecordVerifiedModuleCompletionInput = {
  privyUserId: string
  moduleNumber: number
  source?: string
  sourceEventId?: string | null
  metadata?: Record<string, unknown>
  rewardTrack?: 'full_academy' | 'single_module'
  entitlementId?: string
}

export function normalizeModuleNumber(input: unknown): number {
  const moduleNumber = Number(input)
  if (!Number.isInteger(moduleNumber) || moduleNumber < 1 || moduleNumber > 6) {
    throw new Error('Invalid moduleNumber: expected integer between 1 and 6')
  }
  return moduleNumber
}

export function getMilestoneForModule(moduleNumber: number): MilestoneNumber {
  const normalizedModuleNumber = normalizeModuleNumber(moduleNumber)
  if (normalizedModuleNumber <= 2) return 1
  if (normalizedModuleNumber <= 4) return 2
  return 3
}

export function getRequiredModulesForMilestone(milestoneNumber: number): number[] {
  if (!Number.isInteger(milestoneNumber) || milestoneNumber < 1 || milestoneNumber > 3) {
    throw new Error('Invalid milestoneNumber: expected integer between 1 and 3')
  }

  const start = (milestoneNumber - 1) * 2 + 1
  return [start, start + 1]
}

export function calculateEligibleMilestones(completedModules: number[]): number[] {
  const completedSet = new Set(completedModules.map(normalizeModuleNumber))
  const eligibleMilestones: number[] = []

  for (let milestoneNumber = 1; milestoneNumber <= 3; milestoneNumber += 1) {
    const requiredModules = getRequiredModulesForMilestone(milestoneNumber)
    const isEligible = requiredModules.every((moduleNumber) => completedSet.has(moduleNumber))
    if (isEligible) {
      eligibleMilestones.push(milestoneNumber)
    }
  }

  return eligibleMilestones
}

function getModuleRangeForMilestone(milestoneNumber: MilestoneNumber): { moduleStart: number; moduleEnd: number } {
  const required = getRequiredModulesForMilestone(milestoneNumber)
  return { moduleStart: required[0], moduleEnd: required[required.length - 1] }
}

async function ensureMilestoneRows(privyUserId: string): Promise<void> {
  for (const milestoneNumber of [1, 2, 3] as const) {
    const { moduleStart, moduleEnd } = getModuleRangeForMilestone(milestoneNumber)

    const { error } = await getSupabaseAdmin().from('iv_reward_milestones').upsert(
      {
        privy_user_id: privyUserId,
        milestone_number: milestoneNumber,
        module_start: moduleStart,
        module_end: moduleEnd,
        status: 'locked',
      },
      {
        onConflict: 'privy_user_id,milestone_number',
        ignoreDuplicates: true,
      },
    )

    if (error) {
      throw new Error(error.message)
    }
  }
}

export async function syncVaultXpForUser(privyUserId: string): Promise<{ completedModuleCount: number; vaultXp: number }> {
  const { data, error } = await getSupabaseAdmin()
    .from('iv_module_completions')
    .select('module_number')
    .eq('privy_user_id', privyUserId)

  if (error) {
    throw new Error(error.message)
  }

  const completedModules = new Set(
    (data ?? [])
      .map((row) => Number((row as { module_number: number }).module_number))
      .filter((moduleNumber) => Number.isInteger(moduleNumber) && moduleNumber >= 1 && moduleNumber <= 6),
  )
  const vaultXp = completedModules.size * XP_PER_COMPLETED_MODULE

  const { error: profileError } = await getSupabaseAdmin()
    .from('iv_user_profiles')
    .update({ vault_xp: vaultXp })
    .eq('privy_user_id', privyUserId)

  if (profileError) {
    throw new Error(profileError.message)
  }

  return {
    completedModuleCount: completedModules.size,
    vaultXp,
  }
}

export async function syncRewardMilestonesForUser(privyUserId: string): Promise<{ eligibleMilestones: number[] }> {
  await ensureMilestoneRows(privyUserId)

  const { data: completionRows, error: completionError } = await getSupabaseAdmin()
    .from('iv_module_completions')
    .select('module_number')
    .eq('privy_user_id', privyUserId)

  if (completionError) {
    throw new Error(completionError.message)
  }

  const completedModules = (completionRows ?? [])
    .map((row) => Number((row as { module_number: number }).module_number))
    .filter((moduleNumber) => Number.isInteger(moduleNumber) && moduleNumber >= 1 && moduleNumber <= 6)

  const eligibleMilestones = calculateEligibleMilestones(completedModules)

  const { data: milestoneRows, error: milestoneError } = await getSupabaseAdmin()
    .from('iv_reward_milestones')
    .select('id, milestone_number, status')
    .eq('privy_user_id', privyUserId)

  if (milestoneError) {
    throw new Error(milestoneError.message)
  }

  const immutableStatuses: MilestoneStatus[] = ['queued', 'processing', 'paid', 'failed', 'canceled']
  const eligibleSet = new Set(eligibleMilestones)

  for (const row of (milestoneRows ?? []) as Array<{ id: string; milestone_number: number; status: MilestoneStatus }>) {
    if (!eligibleSet.has(row.milestone_number)) continue
    if (row.status === 'eligible') continue
    if (immutableStatuses.includes(row.status)) continue

    const { error } = await getSupabaseAdmin()
      .from('iv_reward_milestones')
      .update({ status: 'eligible', eligible_at: new Date().toISOString() })
      .eq('id', row.id)

    if (error) {
      throw new Error(error.message)
    }
  }

  return { eligibleMilestones }
}

export async function recordVerifiedModuleCompletion(
  input: RecordVerifiedModuleCompletionInput,
): Promise<{ recorded: boolean; eligibleMilestones: number[]; queuedMilestones: number[]; walletMissing: boolean; reason?: string; instantPayout?: InstantPayoutResult }> {
  const moduleNumber = normalizeModuleNumber(input.moduleNumber)

  const completionConfirmed = await isModuleComplete(input.privyUserId, moduleNumber)
  if (!completionConfirmed) {
    return {
      recorded: false,
      eligibleMilestones: [],
      queuedMilestones: [],
      walletMissing: false,
      reason: 'Module is not yet complete according to quiz completion state',
    }
  }

  const source = input.source?.trim() || 'academy'

  const { error } = await getSupabaseAdmin().from('iv_module_completions').upsert(
    {
      privy_user_id: input.privyUserId,
      module_number: moduleNumber,
      source,
      source_event_id: input.sourceEventId ?? null,
      metadata: input.metadata ?? {},
      completed_at: new Date().toISOString(),
      verified_at: new Date().toISOString(),
    },
    {
      onConflict: 'privy_user_id,module_number',
      ignoreDuplicates: true,
    },
  )

  if (error) {
    throw new Error(error.message)
  }

  await syncVaultXpForUser(input.privyUserId)

  if (input.rewardTrack === 'single_module') {
    const result = await queuePayoutForSingleModule({
      privyUserId: input.privyUserId,
      moduleNumber,
      entitlementId: input.entitlementId,
    })

    let instantPayout: InstantPayoutResult | undefined
    if (result.jobId) {
      instantPayout = await processPayoutJobNow({
        jobId: result.jobId,
        privyUserId: input.privyUserId,
        rewardTrack: 'single_module',
        moduleNumber,
      }).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Instant payout failed'
        console.warn('[rewards:instant] single_module payout error:', message)
        return { status: 'failed' as const, error: message }
      })
    }

    return {
      recorded: true,
      eligibleMilestones: [],
      queuedMilestones: [],
      walletMissing: result.walletMissing,
      instantPayout,
    }
  }

  const { eligibleMilestones } = await syncRewardMilestonesForUser(input.privyUserId)
  const { queuedMilestones, walletMissing, milestoneJobIds } = await syncPayoutJobsForUser(input.privyUserId, {
    entitlementId: input.entitlementId,
  })

  let lastInstantPayout: InstantPayoutResult | undefined
  for (const [milestoneStr, jobId] of Object.entries(milestoneJobIds)) {
    const milestoneNumber = Number(milestoneStr)
    lastInstantPayout = await processPayoutJobNow({
      jobId,
      privyUserId: input.privyUserId,
      rewardTrack: 'full_academy',
      milestoneNumber,
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Instant payout failed'
      console.warn('[rewards:instant] milestone', milestoneNumber, 'payout error:', message)
      return { status: 'failed' as const, error: message }
    })
  }

  return {
    recorded: true,
    eligibleMilestones,
    queuedMilestones,
    walletMissing,
    instantPayout: lastInstantPayout,
  }
}
