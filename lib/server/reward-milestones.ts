import { getSupabaseAdmin } from '@/lib/server/supabase-admin'
import { isModuleComplete } from '@/lib/server/module-completion'

type MilestoneNumber = 1 | 2 | 3

type MilestoneStatus = 'locked' | 'eligible' | 'queued' | 'processing' | 'paid' | 'failed' | 'canceled'

type RecordVerifiedModuleCompletionInput = {
  privyUserId: string
  moduleNumber: number
  source?: string
  sourceEventId?: string | null
  metadata?: Record<string, unknown>
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
): Promise<{ recorded: boolean; eligibleMilestones: number[]; reason?: string }> {
  const moduleNumber = normalizeModuleNumber(input.moduleNumber)

  const completionConfirmed = await isModuleComplete(input.privyUserId, moduleNumber)
  if (!completionConfirmed) {
    return {
      recorded: false,
      eligibleMilestones: [],
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

  const { eligibleMilestones } = await syncRewardMilestonesForUser(input.privyUserId)

  return {
    recorded: true,
    eligibleMilestones,
  }
}
