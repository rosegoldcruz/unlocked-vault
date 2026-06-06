import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAccess } from '@/lib/server/member-access'
import { getRedactedRewardConfig } from '@/lib/server/reward-config'
import { validatePayoutTransferConfig } from '@/lib/server/solana-payout'
import { getSupabaseAdmin } from '@/lib/server/supabase-admin'

function mapAccessErrorToStatus(error: unknown): number {
  const message = error instanceof Error ? error.message : ''
  if (message.startsWith('Unauthorized:')) return 401
  if (message.startsWith('Forbidden:')) return 403
  return 500
}

async function isRpcReachableSafe(): Promise<boolean | null> {
  try {
    const { connection } = validatePayoutTransferConfig()

    const timeout = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 3000)
    })

    const probe = connection.getLatestBlockhash('confirmed').then(() => true).catch(() => false)
    const result = await Promise.race([probe, timeout])
    return result
  } catch {
    return null
  }
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
    const redactedConfig = getRedactedRewardConfig()

    const [queuedCountResult, failedCountResult, lastJobResult, lastSuccessResult, rpcReachable] = await Promise.all([
      getSupabaseAdmin()
        .from('iv_payout_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'queued'),
      getSupabaseAdmin()
        .from('iv_payout_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed'),
      getSupabaseAdmin()
        .from('iv_payout_jobs')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle<{ updated_at: string }>(),
      getSupabaseAdmin()
        .from('iv_payout_transactions')
        .select('confirmed_at, created_at')
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle<{ confirmed_at: string | null; created_at: string }>(),
      isRpcReachableSafe(),
    ])

    if (queuedCountResult.error) throw new Error(queuedCountResult.error.message)
    if (failedCountResult.error) throw new Error(failedCountResult.error.message)
    if (lastJobResult.error) throw new Error(lastJobResult.error.message)
    if (lastSuccessResult.error) throw new Error(lastSuccessResult.error.message)

    return NextResponse.json({
      config: redactedConfig,
      workerEnabled: redactedConfig.payoutWorkerEnabled,
      dryRunEnabled: redactedConfig.payoutDryRun,
      tokenMintConfigured: Boolean(redactedConfig.tokenMintAddress),
      rewardWalletConfigured: Boolean(redactedConfig.rewardWalletPublicKey),
      rpcReachable,
      queuedPayoutCount: queuedCountResult.count ?? 0,
      failedPayoutCount: failedCountResult.count ?? 0,
      lastPayoutAttempt: lastJobResult.data?.updated_at ?? null,
      lastSuccessfulPayout: lastSuccessResult.data?.confirmed_at ?? lastSuccessResult.data?.created_at ?? null,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load reward health'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
