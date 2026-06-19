import { getSupabaseAdmin } from '@/lib/server/supabase-admin'
import {
  buildRewardTierJobMetadata,
  getRewardAmountRawForMilestone,
  getRewardConfig,
  getSingleModuleRewardAmountRaw,
  type RewardTierMetadata,
} from '@/lib/server/reward-config'
import { getCanonicalSolanaWalletForUser, isValidSolanaPublicKey } from '@/lib/server/ivt-solana-wallet'

async function resolvePayoutWallet(privyUserId: string) {
  const wallet = await getCanonicalSolanaWalletForUser(privyUserId)
  return isValidSolanaPublicKey(wallet.walletAddress) ? wallet : { walletAddress: null, source: 'none' as const }
}

async function getEntitlementMetadata(entitlementId?: string | null): Promise<RewardTierMetadata | null> {
  if (!entitlementId) return null

  const { data, error } = await getSupabaseAdmin()
    .from('iv_member_entitlements')
    .select('metadata')
    .eq('id', entitlementId)
    .maybeSingle<{ metadata: RewardTierMetadata | null }>()

  if (error) throw new Error(error.message)
  return data?.metadata ?? null
}

export async function queuePayoutForEligibleMilestone(input: {
  privyUserId: string
  milestoneNumber: number
  entitlementId?: string
}): Promise<{ queued: boolean; walletMissing: boolean; jobId: string | null }> {
  const milestoneNumber = Number(input.milestoneNumber)
  if (!Number.isInteger(milestoneNumber) || milestoneNumber < 1 || milestoneNumber > 3) {
    throw new Error('Invalid milestoneNumber: expected integer between 1 and 3')
  }

  const { data: milestone, error: milestoneError } = await getSupabaseAdmin()
    .from('iv_reward_milestones')
    .select('id, status')
    .eq('privy_user_id', input.privyUserId)
    .eq('milestone_number', milestoneNumber)
    .maybeSingle<{ id: string; status: string }>()

  if (milestoneError) {
    throw new Error(milestoneError.message)
  }

  if (!milestone || milestone.status !== 'eligible') {
    return { queued: false, walletMissing: false, jobId: null }
  }

  const wallet = await resolvePayoutWallet(input.privyUserId)
  if (!wallet.walletAddress) {
    return { queued: false, walletMissing: true, jobId: null }
  }

  const { data: existingJob, error: existingJobError } = await getSupabaseAdmin()
    .from('iv_payout_jobs')
    .select('id')
    .eq('privy_user_id', input.privyUserId)
    .eq('milestone_number', milestoneNumber)
    .maybeSingle<{ id: string }>()

  if (existingJobError) {
    throw new Error(existingJobError.message)
  }

  if (existingJob?.id) {
    return { queued: false, walletMissing: false, jobId: existingJob.id }
  }

  const config = getRewardConfig()
  const entitlementMetadata = await getEntitlementMetadata(input.entitlementId)
  const amountRaw = getRewardAmountRawForMilestone(milestoneNumber, entitlementMetadata, {
    rewardTrack: 'full_academy',
    accessType: 'all_modules',
    milestoneNumber,
  })
  const tierMetadata = buildRewardTierJobMetadata(entitlementMetadata)
  if (!isValidSolanaPublicKey(config.tokenMintAddress)) throw new Error('Invalid IVT token mint address')

  const { data: insertedJob, error: insertJobError } = await getSupabaseAdmin().from('iv_payout_jobs').insert({
    privy_user_id: input.privyUserId,
    milestone_number: milestoneNumber,
    reward_track: 'full_academy',
    access_type: 'all_modules',
    module_number: null,
    entitlement_id: input.entitlementId ?? null,
    wallet_address: wallet.walletAddress,
    token_mint: config.tokenMintAddress,
    amount_raw: amountRaw,
    status: 'queued',
    metadata: {
      source: 'reward-milestone',
      ...tierMetadata,
      wallet_source: wallet.source,
    },
  }).select('id').maybeSingle<{ id: string }>()

  if (insertJobError) {
    throw new Error(insertJobError.message)
  }

  const { error: milestoneUpdateError } = await getSupabaseAdmin()
    .from('iv_reward_milestones')
    .update({ status: 'queued' })
    .eq('id', milestone.id)
    .eq('status', 'eligible')

  if (milestoneUpdateError) {
    throw new Error(milestoneUpdateError.message)
  }

  return { queued: true, walletMissing: false, jobId: insertedJob?.id ?? null }
}

export async function queuePayoutForSingleModule(input: {
  privyUserId: string
  moduleNumber: number
  entitlementId?: string
}): Promise<{ queued: boolean; walletMissing: boolean; jobId: string | null }> {
  if (!Number.isInteger(input.moduleNumber) || input.moduleNumber < 1 || input.moduleNumber > 6) {
    throw new Error('Invalid moduleNumber: expected integer between 1 and 6')
  }

  const wallet = await resolvePayoutWallet(input.privyUserId)
  if (!wallet.walletAddress) {
    return { queued: false, walletMissing: true, jobId: null }
  }

  let existingQuery = getSupabaseAdmin()
    .from('iv_payout_jobs')
    .select('id')
    .eq('privy_user_id', input.privyUserId)
    .eq('reward_track', 'single_module')
    .eq('module_number', input.moduleNumber)

  existingQuery = input.entitlementId
    ? existingQuery.eq('entitlement_id', input.entitlementId)
    : existingQuery.is('entitlement_id', null)

  const { data: existingJob, error: existingJobError } = await existingQuery.maybeSingle<{ id: string }>()
  if (existingJobError) throw new Error(existingJobError.message)
  if (existingJob?.id) return { queued: false, walletMissing: false, jobId: existingJob.id }

  const config = getRewardConfig()
  const entitlementMetadata = await getEntitlementMetadata(input.entitlementId)
  const amountRaw = getSingleModuleRewardAmountRaw(entitlementMetadata, {
    rewardTrack: 'single_module',
    accessType: 'single_module',
    moduleNumber: input.moduleNumber,
  })
  const tierMetadata = buildRewardTierJobMetadata(entitlementMetadata)
  if (!isValidSolanaPublicKey(config.tokenMintAddress)) throw new Error('Invalid IVT token mint address')

  const { data: insertedJob, error } = await getSupabaseAdmin().from('iv_payout_jobs').insert({
    privy_user_id: input.privyUserId,
    milestone_number: null,
    reward_track: 'single_module',
    access_type: 'single_module',
    module_number: input.moduleNumber,
    entitlement_id: input.entitlementId ?? null,
    wallet_address: wallet.walletAddress,
    token_mint: config.tokenMintAddress,
    amount_raw: amountRaw,
    status: 'queued',
    metadata: {
      source: 'single-module-completion',
      reward_track: 'single_module',
      access_type: 'single_module',
      module_number: input.moduleNumber,
      entitlement_id: input.entitlementId ?? null,
      ...tierMetadata,
      wallet_source: wallet.source,
    },
  }).select('id').maybeSingle<{ id: string }>()

  if (error) throw new Error(error.message)
  return { queued: true, walletMissing: false, jobId: insertedJob?.id ?? null }
}

export async function syncPayoutJobsForUser(
  privyUserId: string,
  options?: { entitlementId?: string },
): Promise<{ queuedMilestones: number[]; walletMissing: boolean; milestoneJobIds: Record<number, string> }> {
  const { data: milestones, error } = await getSupabaseAdmin()
    .from('iv_reward_milestones')
    .select('milestone_number, status')
    .eq('privy_user_id', privyUserId)

  if (error) {
    throw new Error(error.message)
  }

  const eligibleMilestones = (milestones ?? [])
    .filter((row) => (row as { status: string }).status === 'eligible')
    .map((row) => Number((row as { milestone_number: number }).milestone_number))
    .filter((milestoneNumber) => Number.isInteger(milestoneNumber) && milestoneNumber >= 1 && milestoneNumber <= 3)

  const queuedMilestones: number[] = []
  const milestoneJobIds: Record<number, string> = {}
  let walletMissing = false

  for (const milestoneNumber of eligibleMilestones) {
    const result = await queuePayoutForEligibleMilestone({
      privyUserId,
      milestoneNumber,
      entitlementId: options?.entitlementId,
    })
    if (result.queued) queuedMilestones.push(milestoneNumber)
    if (result.jobId) milestoneJobIds[milestoneNumber] = result.jobId
    if (result.walletMissing) walletMissing = true
  }

  return { queuedMilestones, walletMissing, milestoneJobIds }
}
