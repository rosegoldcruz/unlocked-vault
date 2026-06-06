import { PrivyClient } from '@privy-io/server-auth'
import { getSupabaseAdmin } from '@/lib/server/supabase-admin'
import { getRewardAmountRawForMilestone, getRewardConfig } from '@/lib/server/reward-config'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

function extractWalletAddress(user: unknown): string | null {
  if (!user || typeof user !== 'object') return null

  const maybeUser = user as {
    wallet?: { address?: string }
    linkedAccounts?: Array<{ type?: string; address?: string }>
    linked_accounts?: Array<{ type?: string; address?: string }>
  }

  if (typeof maybeUser.wallet?.address === 'string' && maybeUser.wallet.address.trim().length > 0) {
    return maybeUser.wallet.address
  }

  const linked = maybeUser.linkedAccounts ?? maybeUser.linked_accounts ?? []
  for (const account of linked) {
    if ((account?.type === 'wallet' || account?.type === 'smart_wallet') && typeof account.address === 'string' && account.address.trim().length > 0) {
      return account.address
    }
  }

  return null
}

async function getPrivyWalletAddress(privyUserId: string): Promise<string | null> {
  const client = new PrivyClient(requireEnv('NEXT_PUBLIC_PRIVY_APP_ID'), requireEnv('PRIVY_APP_SECRET'))
  const user = await client.getUser(privyUserId)
  return extractWalletAddress(user)
}

async function getProfileWalletAddress(privyUserId: string): Promise<string | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('iv_user_profiles')
    .select('wallet_address')
    .eq('privy_user_id', privyUserId)
    .maybeSingle<{ wallet_address: string | null }>()

  if (error) {
    throw new Error(error.message)
  }

  return data?.wallet_address ?? null
}

async function resolveWalletAddress(privyUserId: string): Promise<string | null> {
  const privyWallet = await getPrivyWalletAddress(privyUserId)
  if (privyWallet) return privyWallet

  const profileWallet = await getProfileWalletAddress(privyUserId)
  if (profileWallet && profileWallet.trim().length > 0) return profileWallet

  return null
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

  const walletAddress = await resolveWalletAddress(input.privyUserId)
  if (!walletAddress) {
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

  const { error: insertJobError } = await getSupabaseAdmin().from('iv_payout_jobs').insert({
    privy_user_id: input.privyUserId,
    milestone_number: milestoneNumber,
    wallet_address: walletAddress,
    token_mint: config.tokenMintAddress,
    amount_raw: amountRaw,
    status: 'queued',
    metadata: {
      source: 'reward-milestone',
      wallet_source: 'privy_or_profile',
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
