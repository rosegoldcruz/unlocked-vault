import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAccess } from '@/lib/server/member-access'
import { getSupabaseAdmin } from '@/lib/server/supabase-admin'
import { isValidSolanaPublicKey } from '@/lib/server/ivt-solana-wallet'

type PayoutJobStatus = 'queued' | 'processing' | 'paid' | 'failed' | 'canceled'

type PayoutJobRow = {
  id: string
  status: PayoutJobStatus
  reward_track: string
  module_number: number | null
  amount_raw: string
  wallet_address: string | null
  next_attempt_at: string | null
  created_at: string
}

type PayoutTransactionRow = {
  id: string
  payout_job_id: string | null
  reward_track: string | null
  module_number: number | null
  amount_raw: string
  wallet_address: string | null
  signature: string | null
  status: string
  confirmed_at: string | null
  created_at: string
}

function mapAccessErrorToStatus(error: unknown): number {
  const message = error instanceof Error ? error.message : ''
  if (message.startsWith('Unauthorized:')) return 401
  if (message.startsWith('Forbidden:')) return 403
  return 500
}

function getShape(value: string | null | undefined) {
  if (!value) {
    return {
      present: false,
      length: 0,
      prefix: null,
      suffix: null,
    }
  }

  return {
    present: true,
    length: value.length,
    prefix: value.slice(0, 4),
    suffix: value.slice(-4),
  }
}

function sanitizeJob(row: PayoutJobRow) {
  return {
    id: row.id,
    status: row.status,
    rewardTrack: row.reward_track,
    moduleNumber: row.module_number,
    amountRaw: row.amount_raw,
    walletShape: getShape(row.wallet_address),
    walletValidSolana: isValidSolanaPublicKey(row.wallet_address),
    nextAttemptAt: row.next_attempt_at,
    createdAt: row.created_at,
  }
}

function sanitizeTransaction(row: PayoutTransactionRow) {
  return {
    id: row.id,
    payoutJobId: row.payout_job_id,
    rewardTrack: row.reward_track,
    moduleNumber: row.module_number,
    amountRaw: row.amount_raw,
    walletShape: getShape(row.wallet_address),
    walletValidSolana: isValidSolanaPublicKey(row.wallet_address),
    signatureShape: getShape(row.signature),
    signatureExists: Boolean(row.signature),
    status: row.status,
    confirmedAt: row.confirmed_at,
    createdAt: row.created_at,
  }
}

async function countJobsByStatus(status: PayoutJobStatus): Promise<number> {
  const { count, error } = await getSupabaseAdmin()
    .from('iv_payout_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('status', status)

  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminAccess(req)
  } catch (error: unknown) {
    const status = mapAccessErrorToStatus(error)
    const message = error instanceof Error ? error.message : 'Failed to verify admin access'
    return NextResponse.json({ error: message }, { status })
  }

  try {
    const [
      queuedCount,
      paidCount,
      failedCount,
      latestQueuedResult,
      latestPaidResult,
      highAmountQueuedResult,
      internalTestJobsResult,
      signatureResult,
    ] = await Promise.all([
      countJobsByStatus('queued'),
      countJobsByStatus('paid'),
      countJobsByStatus('failed'),
      getSupabaseAdmin()
        .from('iv_payout_jobs')
        .select('id, status, reward_track, module_number, amount_raw, wallet_address, next_attempt_at, created_at')
        .eq('status', 'queued')
        .order('created_at', { ascending: false })
        .limit(10),
      getSupabaseAdmin()
        .from('iv_payout_transactions')
        .select('id, payout_job_id, reward_track, module_number, amount_raw, wallet_address, signature, status, confirmed_at, created_at')
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(10),
      getSupabaseAdmin()
        .from('iv_payout_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'queued')
        .neq('amount_raw', '1'),
      getSupabaseAdmin()
        .from('iv_payout_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'queued')
        .eq('reward_track', 'single_module')
        .eq('module_number', 1)
        .eq('amount_raw', '1'),
      getSupabaseAdmin()
        .from('iv_payout_transactions')
        .select('id', { count: 'exact', head: true })
        .not('signature', 'is', null),
    ])

    if (latestQueuedResult.error) throw new Error(latestQueuedResult.error.message)
    if (latestPaidResult.error) throw new Error(latestPaidResult.error.message)
    if (highAmountQueuedResult.error) throw new Error(highAmountQueuedResult.error.message)
    if (internalTestJobsResult.error) throw new Error(internalTestJobsResult.error.message)
    if (signatureResult.error) throw new Error(signatureResult.error.message)

    return NextResponse.json({
      counts: {
        queued: queuedCount,
        paid: paidCount,
        failed: failedCount,
      },
      latestQueuedJobs: ((latestQueuedResult.data ?? []) as PayoutJobRow[]).map(sanitizeJob),
      latestPaidTransactions: ((latestPaidResult.data ?? []) as PayoutTransactionRow[]).map(sanitizeTransaction),
      highAmountQueuedJobsExist: (highAmountQueuedResult.count ?? 0) > 0,
      internalTestAmountOneJobsExist: (internalTestJobsResult.count ?? 0) > 0,
      transactionSignaturesExist: (signatureResult.count ?? 0) > 0,
      readOnly: true,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load payout status'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
