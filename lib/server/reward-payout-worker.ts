import { getSupabaseAdmin } from '@/lib/server/supabase-admin'
import { getRewardConfig } from '@/lib/server/reward-config'
import { sendTokenRewardPayout } from '@/lib/server/solana-payout'
import { isValidSolanaPublicKey } from '@/lib/server/ivt-solana-wallet'

export type RewardWorkerResult = {
  processedCount: number
  processed: Array<{ jobId: string; status: string }>
}

function computeNextAttemptAt(attempt: number): string {
  const backoffMinutes = Math.min(60, Math.max(1, attempt) * 5)
  return new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString()
}

async function markMilestonePaid(privyUserId: string, milestoneNumber: number | null) {
  if (milestoneNumber === null) return
  const { error } = await getSupabaseAdmin()
    .from('iv_reward_milestones')
    .update({ status: 'paid' })
    .eq('privy_user_id', privyUserId)
    .eq('milestone_number', milestoneNumber)

  if (error) throw new Error(error.message)
}

async function processLockedJob(input: {
  id: string
  privy_user_id: string
  milestone_number: number | null
  reward_track: string
  access_type: string
  module_number: number | null
  entitlement_id: string | null
  wallet_address: string
  token_mint: string
  amount_raw: string
  attempts: number
  max_attempts: number
  workerId: string
}) {
  const config = getRewardConfig()
  if (!isValidSolanaPublicKey(input.wallet_address)) {
    throw new Error('Invalid payout wallet_address')
  }
  if (!isValidSolanaPublicKey(input.token_mint)) {
    throw new Error('Invalid payout token_mint')
  }
  if (input.token_mint !== config.tokenMintAddress) {
    throw new Error('Payout token_mint does not match configured IVT token mint')
  }

  const { data: existingTx, error: existingTxError } = await getSupabaseAdmin()
    .from('iv_payout_transactions')
    .select('id, signature, status')
    .eq('payout_job_id', input.id)
    .maybeSingle<{ id: string; signature: string; status: string }>()

  if (existingTxError) throw new Error(existingTxError.message)

  if (existingTx?.id) {
    const { error: paidUpdateError } = await getSupabaseAdmin()
      .from('iv_payout_jobs')
      .update({ status: 'paid', locked_at: null, locked_by: null, last_error: null })
      .eq('id', input.id)
      .eq('locked_by', input.workerId)

    if (paidUpdateError) throw new Error(paidUpdateError.message)

    await markMilestonePaid(input.privy_user_id, input.milestone_number)
    return { status: 'paid-existing' as const }
  }

  const payout = await sendTokenRewardPayout({
    destinationWalletAddress: input.wallet_address,
    amountRaw: input.amount_raw,
  })

  if (payout.dryRun || !payout.signature) {
    const { error: dryRunUpdateError } = await getSupabaseAdmin()
      .from('iv_payout_jobs')
      .update({
        status: 'queued',
        attempts: input.attempts + 1,
        next_attempt_at: null,
        last_error: 'Dry run mode enabled; no on-chain transfer executed',
        locked_at: null,
        locked_by: null,
      })
      .eq('id', input.id)
      .eq('locked_by', input.workerId)

    if (dryRunUpdateError) throw new Error(dryRunUpdateError.message)
    return { status: 'dry-run' as const }
  }

  const { error: txInsertError } = await getSupabaseAdmin().from('iv_payout_transactions').insert({
    payout_job_id: input.id,
    privy_user_id: input.privy_user_id,
    milestone_number: input.milestone_number,
    reward_track: input.reward_track,
    access_type: input.access_type,
    module_number: input.module_number,
    entitlement_id: input.entitlement_id,
    wallet_address: input.wallet_address,
    token_mint: input.token_mint,
    amount_raw: input.amount_raw,
    signature: payout.signature,
    status: 'confirmed',
    confirmed_at: new Date().toISOString(),
    raw_response: {
      source_token_account: payout.sourceTokenAccount,
      destination_token_account: payout.destinationTokenAccount,
    },
  })

  if (txInsertError && txInsertError.code !== '23505') {
    throw new Error(txInsertError.message)
  }

  const { error: paidUpdateError } = await getSupabaseAdmin()
    .from('iv_payout_jobs')
    .update({ status: 'paid', locked_at: null, locked_by: null, last_error: null })
    .eq('id', input.id)
    .eq('locked_by', input.workerId)

  if (paidUpdateError) throw new Error(paidUpdateError.message)

  await markMilestonePaid(input.privy_user_id, input.milestone_number)
  return { status: 'paid' as const }
}

async function handleLockedJobError(input: {
  id: string
  attempts: number
  max_attempts: number
  workerId: string
  errorMessage: string
}) {
  const nextAttempts = input.attempts + 1
  const reachedMax = nextAttempts >= input.max_attempts

  const updatePayload = reachedMax
    ? {
      status: 'failed',
      attempts: nextAttempts,
      next_attempt_at: null,
      last_error: input.errorMessage,
      locked_at: null,
      locked_by: null,
    }
    : {
      status: 'queued',
      attempts: nextAttempts,
      next_attempt_at: computeNextAttemptAt(nextAttempts),
      last_error: input.errorMessage,
      locked_at: null,
      locked_by: null,
    }

  const { error } = await getSupabaseAdmin()
    .from('iv_payout_jobs')
    .update(updatePayload)
    .eq('id', input.id)
    .eq('locked_by', input.workerId)

  if (error) throw new Error(error.message)
}

export async function runRewardPayoutWorker(input?: { payoutJobId?: string }): Promise<RewardWorkerResult> {
  const config = getRewardConfig()
  if (!config.payoutWorkerEnabled) {
    return {
      processedCount: 0,
      processed: [],
    }
  }

  const nowIso = new Date().toISOString()
  const nowTime = Date.now()
  const workerId = `payout-worker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const processed: Array<{ jobId: string; status: string }> = []

  const maxPayouts = input?.payoutJobId ? 1 : config.maxPayoutsPerRun

  for (let index = 0; index < maxPayouts; index += 1) {
    let candidateQuery = getSupabaseAdmin()
      .from('iv_payout_jobs')
      .select('id, privy_user_id, milestone_number, reward_track, access_type, module_number, entitlement_id, wallet_address, token_mint, amount_raw, attempts, max_attempts, next_attempt_at, created_at')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(input?.payoutJobId ? 1 : Math.max(5, config.maxPayoutsPerRun))

    if (input?.payoutJobId) {
      candidateQuery = candidateQuery.eq('id', input.payoutJobId)
    }

    const { data: candidateRows, error: candidateError } = await candidateQuery

    if (candidateError) throw new Error(candidateError.message)

    const candidate = (candidateRows ?? []).find((row) => {
      const nextAttemptAt = (row as { next_attempt_at: string | null }).next_attempt_at
      if (!nextAttemptAt) return true
      const parsed = Date.parse(nextAttemptAt)
      if (Number.isNaN(parsed)) return true
      return parsed <= nowTime
    }) as {
      id: string
      privy_user_id: string
      milestone_number: number | null
      reward_track: string
      access_type: string
      module_number: number | null
      entitlement_id: string | null
      wallet_address: string
      token_mint: string
      amount_raw: string
      attempts: number
      max_attempts: number
    } | undefined

    if (!candidate) break

    const { data: lockedRows, error: lockError } = await getSupabaseAdmin()
      .from('iv_payout_jobs')
      .update({
        status: 'processing',
        locked_at: nowIso,
        locked_by: workerId,
      })
      .eq('id', candidate.id)
      .eq('status', 'queued')
      .select('id')

    if (lockError) throw new Error(lockError.message)
    if (!lockedRows || lockedRows.length === 0) continue

    try {
      const outcome = await processLockedJob({
        ...candidate,
        workerId,
      })

      processed.push({
        jobId: candidate.id,
        status: outcome.status,
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to process payout job'
      await handleLockedJobError({
        id: candidate.id,
        attempts: candidate.attempts,
        max_attempts: candidate.max_attempts,
        workerId,
        errorMessage: message,
      })

      processed.push({
        jobId: candidate.id,
        status: 'error',
      })
    }
  }

  return {
    processedCount: processed.length,
    processed,
  }
}
