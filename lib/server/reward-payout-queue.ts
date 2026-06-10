import { getSupabaseAdmin } from '@/lib/server/supabase-admin'
import { getRewardAmountRawForMilestone, getRewardConfig, getSingleModuleRewardAmountRaw } from '@/lib/server/reward-config'
import { getCanonicalSolanaWalletForUser, isValidSolanaPublicKey } from '@/lib/server/ivt-solana-wallet'

async function resolvePayoutWallet(privyUserId: string) {
  const wallet = await getCanonicalSolanaWalletForUser(privyUserId)
  return isValidSolanaPublicKey(wallet.walletAddress) ? wallet : { walletAddress: null, source: 'none' as const }
}

export async function queuePayoutForEligibleMilestone(input: {
  privyUserId: string
  milestoneNumber: number
}): Promise<{ queued: boolean; walletMissing: boolean }> {
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
    return { queued: false, walletMissing: false }
  }

  const wallet = await resolvePayoutWallet(input.privyUserId)
  if (!wallet.walletAddress) {
    return { queued: false, walletMissing: true }
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
    return { queued: false, walletMissing: false }
  }

  const config = getRewardConfig()
  const amountRaw = getRewardAmountRawForMilestone(milestoneNumber)
  if (!isValidSolanaPublicKey(config.tokenMintAddress)) throw new Error('Invalid IVT token mint address')

  const { error: insertJobError } = await getSupabaseAdmin().from('iv_payout_jobs').insert({
    privy_user_id: input.privyUserId,
    milestone_number: milestoneNumber,
    reward_track: 'full_academy',
    access_type: 'all_modules',
    module_number: null,
    entitlement_id: null,
    wallet_address: wallet.walletAddress,
    token_mint: config.tokenMintAddress,
    amount_raw: amountRaw,
    status: 'queued',
    metadata: {
      source: 'reward-milestone',
      wallet_source: wallet.source,
    },
  })

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

  return { queued: true, walletMissing: false }
}

export async function queuePayoutForSingleModule(input: {
  privyUserId: string
  moduleNumber: number
  entitlementId?: string
}): Promise<{ queued: boolean; walletMissing: boolean }> {
  if (!Number.isInteger(input.moduleNumber) || input.moduleNumber < 1 || input.moduleNumber > 6) {
    throw new Error('Invalid moduleNumber: expected integer between 1 and 6')
  }

  const wallet = await resolvePayoutWallet(input.privyUserId)
  if (!wallet.walletAddress) {
    return { queued: false, walletMissing: true }
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
  if (existingJob?.id) return { queued: false, walletMissing: false }

  const config = getRewardConfig()
  const amountRaw = getSingleModuleRewardAmountRaw()
  if (!isValidSolanaPublicKey(config.tokenMintAddress)) throw new Error('Invalid IVT token mint address')

  const { error } = await getSupabaseAdmin().from('iv_payout_jobs').insert({
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
      wallet_source: wallet.source,
    },
  })

  if (error) throw new Error(error.message)
  return { queued: true, walletMissing: false }
}

export async function syncPayoutJobsForUser(privyUserId: string): Promise<{ queuedMilestones: number[]; walletMissing: boolean }> {
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
  let walletMissing = false

  for (const milestoneNumber of eligibleMilestones) {
    const result = await queuePayoutForEligibleMilestone({ privyUserId, milestoneNumber })
    if (result.queued) queuedMilestones.push(milestoneNumber)
    if (result.walletMissing) walletMissing = true
  }

  return { queuedMilestones, walletMissing }
}
