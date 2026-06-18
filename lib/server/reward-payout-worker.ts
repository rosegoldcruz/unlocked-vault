import { getSupabaseAdmin } from '@/lib/server/supabase-admin'
import { getRewardConfig, getSingleModuleRewardAmountRaw } from '@/lib/server/reward-config'
import { sendTokenRewardPayout } from '@/lib/server/solana-payout'
import { isValidSolanaPublicKey } from '@/lib/server/ivt-solana-wallet'

export type RewardWorkerResult = {
  processedCount: number
  processed: Array<{ jobId: string; status: string; signature?: string }>
}

export type InstantPayoutResult = {
  status: 'paid' | 'already_paid' | 'dry_run' | 'skipped' | 'failed'
  signature?: string
  error?: string
}

type PayoutCandidate = {
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
  next_attempt_at: string | null
}

function computeNextAttemptAt(attempt: number): string {
  const backoffMinutes = Math.min(60, Math.max(1, attempt) * 5)
  return new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString()
}

function isEligibleByNextAttemptAt(nextAttemptAt: string | null, nowTime: number): boolean {
  if (!nextAttemptAt) return true
  const parsed = Date.parse(nextAttemptAt)
  if (Number.isNaN(parsed)) return true
  return parsed <= nowTime
}

function isSafeTestPayoutJob(row: PayoutCandidate, safeTestAmountRaw: string): boolean {
  return row.reward_track === 'single_module'
    && row.module_number === 1
    && row.amount_raw === safeTestAmountRaw
    && isValidSolanaPublicKey(row.wallet_address)
}

async function countSkippedHighAmountQueuedJobs(safeTestAmountRaw: string): Promise<number | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('iv_payout_jobs')
    .select('id, reward_track, module_number, amount_raw')
    .eq('status', 'queued')
    .limit(1000)

  if (error) {
    console.warn('[rewards:worker] safe_test_only skipped_high_amount_count unavailable:', error.message)
    return null
  }

  return (data ?? []).filter((row) => {
    const job = row as { reward_track: string; module_number: number | null; amount_raw: string }
    return !(job.reward_track === 'single_module' && job.module_number === 1 && job.amount_raw === safeTestAmountRaw)
  }).length
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
    console.log('[rewards:worker] paid-existing transaction signature=', existingTx.signature)
    return { status: 'paid-existing' as const, signature: existingTx.signature }
  }

  const payout = await sendTokenRewardPayout({
    destinationWalletAddress: input.wallet_address,
    amountRaw: input.amount_raw,
  })

  if (payout.dryRun || !payout.signature) {
    const nextAttempts = input.attempts + 1
    const { error: dryRunUpdateError } = await getSupabaseAdmin()
      .from('iv_payout_jobs')
      .update({
        status: 'queued',
        attempts: nextAttempts,
        next_attempt_at: computeNextAttemptAt(nextAttempts),
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
  console.log('[rewards:worker] paid transaction signature=', payout.signature)
  return { status: 'paid' as const, signature: payout.signature }
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
  const processed: Array<{ jobId: string; status: string; signature?: string }> = []

  const safeTestAmountRaw = getSingleModuleRewardAmountRaw()
  const maxPayouts = input?.payoutJobId ? 1 : config.maxPayoutsPerRun
  if (config.payoutSafeTestOnly) {
    const skippedHighAmountCount = await countSkippedHighAmountQueuedJobs(safeTestAmountRaw)
    console.log('[rewards:worker] safe_test_only enabled safeTestAmountRaw=', safeTestAmountRaw)
    if (skippedHighAmountCount !== null) {
      console.log('[rewards:worker] safe_test_only skipped_high_amount_count=', skippedHighAmountCount)
    }
  }

  for (let index = 0; index < maxPayouts; index += 1) {
    let candidateQuery = getSupabaseAdmin()
      .from('iv_payout_jobs')
      .select('id, privy_user_id, milestone_number, reward_track, access_type, module_number, entitlement_id, wallet_address, token_mint, amount_raw, attempts, max_attempts, next_attempt_at, created_at')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(input?.payoutJobId ? 1 : Math.max(5, config.maxPayoutsPerRun))

    if (config.payoutSafeTestOnly) {
      candidateQuery = candidateQuery
        .eq('reward_track', 'single_module')
        .eq('module_number', 1)
        .eq('amount_raw', safeTestAmountRaw)
    }

    if (input?.payoutJobId) {
      candidateQuery = candidateQuery.eq('id', input.payoutJobId)
    }

    const { data: candidateRows, error: candidateError } = await candidateQuery

    if (candidateError) throw new Error(candidateError.message)

    const candidate = ((candidateRows ?? []) as PayoutCandidate[]).find((row) => {
      if (!isEligibleByNextAttemptAt(row.next_attempt_at, nowTime)) return false
      if (!config.payoutSafeTestOnly) return true
      return isSafeTestPayoutJob(row, safeTestAmountRaw)
    })

    if (!candidate) break
    console.log('[rewards:worker] selected payout job id=', candidate.id)

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
        ...(outcome.signature ? { signature: outcome.signature } : {}),
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

/**
 * Instantly processes a single payout job tied to a verified completion event.
 * Bypasses payoutWorkerEnabled — this is triggered by a user earning a reward, not the cron.
 * All safety guards still apply (wallet validation, idempotency, amount check, user match).
 */
export async function processPayoutJobNow(input: {
  jobId: string
  privyUserId: string
  rewardTrack: string
  moduleNumber?: number | null
  milestoneNumber?: number | null
  amountRaw?: string
}): Promise<InstantPayoutResult> {
  const config = getRewardConfig()

  const { data: job, error: jobError } = await getSupabaseAdmin()
    .from('iv_payout_jobs')
    .select('id, privy_user_id, milestone_number, reward_track, access_type, module_number, entitlement_id, wallet_address, token_mint, amount_raw, attempts, max_attempts, status')
    .eq('id', input.jobId)
    .maybeSingle<PayoutCandidate & { status: string }>()

  if (jobError) return { status: 'failed', error: jobError.message }
  if (!job) return { status: 'skipped', error: 'Job not found' }

  if (job.privy_user_id !== input.privyUserId) {
    return { status: 'skipped', error: 'Job does not belong to the requesting user' }
  }

  if (job.reward_track !== input.rewardTrack) {
    return { status: 'skipped', error: 'Job reward_track does not match expected value' }
  }

  if (input.moduleNumber !== undefined && input.moduleNumber !== null && job.module_number !== input.moduleNumber) {
    return { status: 'skipped', error: 'Job module_number does not match expected value' }
  }

  if (input.milestoneNumber !== undefined && input.milestoneNumber !== null && job.milestone_number !== input.milestoneNumber) {
    return { status: 'skipped', error: 'Job milestone_number does not match expected value' }
  }

  if (input.amountRaw !== undefined && job.amount_raw !== input.amountRaw) {
    return { status: 'skipped', error: 'Job amount_raw does not match expected value' }
  }

  if (!isValidSolanaPublicKey(job.wallet_address)) {
    return { status: 'failed', error: 'Invalid payout wallet_address (not a valid Solana address)' }
  }

  if (job.wallet_address.startsWith('0x')) {
    return { status: 'failed', error: 'Payout wallet is an EVM address, not Solana' }
  }

  if (!isValidSolanaPublicKey(job.token_mint)) {
    return { status: 'failed', error: 'Invalid payout token_mint' }
  }

  if (job.token_mint !== config.tokenMintAddress) {
    return { status: 'failed', error: 'Payout token_mint does not match configured IVT token mint' }
  }

  if (job.status === 'paid') {
    return { status: 'already_paid' }
  }

  if (job.status !== 'queued') {
    return { status: 'skipped', error: `Job is not in queued state (current: ${job.status})` }
  }

  const { data: existingTx } = await getSupabaseAdmin()
    .from('iv_payout_transactions')
    .select('id, signature')
    .eq('payout_job_id', input.jobId)
    .maybeSingle<{ id: string; signature: string }>()

  if (existingTx?.id) {
    await getSupabaseAdmin()
      .from('iv_payout_jobs')
      .update({ status: 'paid', locked_at: null, locked_by: null, last_error: null })
      .eq('id', input.jobId)
    await markMilestonePaid(job.privy_user_id, job.milestone_number)
    return { status: 'already_paid', signature: existingTx.signature }
  }

  const nowIso = new Date().toISOString()
  const workerId = `instant-payout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const { data: lockedRows, error: lockError } = await getSupabaseAdmin()
    .from('iv_payout_jobs')
    .update({ status: 'processing', locked_at: nowIso, locked_by: workerId })
    .eq('id', input.jobId)
    .eq('status', 'queued')
    .select('id')

  if (lockError) return { status: 'failed', error: lockError.message }
  if (!lockedRows || lockedRows.length === 0) {
    return { status: 'skipped', error: 'Could not acquire lock on job (already being processed)' }
  }

  try {
    const outcome = await processLockedJob({ ...job, workerId })
    if (outcome.status === 'paid' || outcome.status === 'paid-existing') {
      return { status: 'paid', signature: outcome.signature ?? undefined }
    }
    if (outcome.status === 'dry-run') {
      return { status: 'dry_run', error: 'Dry run mode enabled; no on-chain transfer executed' }
    }
    return { status: 'skipped' }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to process payout job'
    await handleLockedJobError({
      id: input.jobId,
      attempts: job.attempts,
      max_attempts: job.max_attempts,
      workerId,
      errorMessage: message,
    })
    return { status: 'failed', error: message }
  }
}
