import { NextRequest, NextResponse } from 'next/server'
import { requireMemberAccess } from '@/lib/server/member-access'
import { getSupabaseAdmin } from '@/lib/server/supabase-admin'

function mapAccessErrorToStatus(error: unknown): number {
  const message = error instanceof Error ? error.message : ''
  if (message.startsWith('Unauthorized:')) return 401
  if (message.startsWith('Forbidden:')) return 403
  return 500
}

function getNextRequiredModule(completedModules: number[]): number | null {
  const completed = new Set(completedModules)
  for (let moduleNumber = 1; moduleNumber <= 6; moduleNumber += 1) {
    if (!completed.has(moduleNumber)) return moduleNumber
  }
  return null
}

export async function GET(req: NextRequest) {
  let privyUserId: string
  let walletAddress: string | null

  try {
    const access = await requireMemberAccess(req)
    privyUserId = access.auth.privyUserId
    walletAddress = access.auth.walletAddress
  } catch (error: unknown) {
    const status = mapAccessErrorToStatus(error)
    const message = error instanceof Error ? error.message : 'Failed to verify member access'
    return NextResponse.json({ error: message }, { status })
  }

  try {
    const [
      profileResult,
      completionsResult,
      milestonesResult,
      payoutJobsResult,
      transactionsResult,
    ] = await Promise.all([
      getSupabaseAdmin()
        .from('iv_user_profiles')
        .select('wallet_address')
        .eq('privy_user_id', privyUserId)
        .maybeSingle<{ wallet_address: string | null }>(),
      getSupabaseAdmin()
        .from('iv_module_completions')
        .select('module_number')
        .eq('privy_user_id', privyUserId)
        .order('module_number', { ascending: true }),
      getSupabaseAdmin()
        .from('iv_reward_milestones')
        .select('milestone_number, module_start, module_end, status, eligible_at')
        .eq('privy_user_id', privyUserId)
        .order('milestone_number', { ascending: true }),
      getSupabaseAdmin()
        .from('iv_payout_jobs')
        .select('milestone_number, status, amount_raw, token_mint, attempts, last_error')
        .eq('privy_user_id', privyUserId)
        .order('milestone_number', { ascending: true }),
      getSupabaseAdmin()
        .from('iv_payout_transactions')
        .select('milestone_number, signature, status, confirmed_at')
        .eq('privy_user_id', privyUserId)
        .order('created_at', { ascending: false }),
    ])

    const errors = [
      profileResult.error,
      completionsResult.error,
      milestonesResult.error,
      payoutJobsResult.error,
      transactionsResult.error,
    ].filter(Boolean)

    if (errors.length > 0) {
      const firstError = errors[0]
      throw new Error(firstError?.message ?? 'Failed to load reward status')
    }

    const completedModules = (completionsResult.data ?? [])
      .map((row) => Number((row as { module_number: number }).module_number))
      .filter((moduleNumber) => Number.isInteger(moduleNumber) && moduleNumber >= 1 && moduleNumber <= 6)

    const resolvedWalletAddress = walletAddress ?? profileResult.data?.wallet_address ?? null

    return NextResponse.json({
      walletAddress: resolvedWalletAddress,
      completedModules,
      milestones: (milestonesResult.data ?? []).map((row) => ({
        milestoneNumber: (row as { milestone_number: number }).milestone_number,
        moduleStart: (row as { module_start: number }).module_start,
        moduleEnd: (row as { module_end: number }).module_end,
        status: (row as { status: string }).status,
        eligibleAt: (row as { eligible_at: string | null }).eligible_at,
      })),
      payoutJobs: (payoutJobsResult.data ?? []).map((row) => ({
        milestoneNumber: (row as { milestone_number: number }).milestone_number,
        status: (row as { status: string }).status,
        amountRaw: (row as { amount_raw: string }).amount_raw,
        tokenMint: (row as { token_mint: string }).token_mint,
        attempts: (row as { attempts: number }).attempts,
        lastError: (row as { last_error: string | null }).last_error,
      })),
      transactions: (transactionsResult.data ?? []).map((row) => ({
        milestoneNumber: (row as { milestone_number: number }).milestone_number,
        signature: (row as { signature: string }).signature,
        status: (row as { status: string }).status,
        confirmedAt: (row as { confirmed_at: string | null }).confirmed_at,
      })),
      nextRequiredModule: getNextRequiredModule(completedModules),
      walletMissing: !resolvedWalletAddress,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load reward status'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
