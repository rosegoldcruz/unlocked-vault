import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAccess } from '@/lib/server/member-access'
import { getSupabaseAdmin } from '@/lib/server/supabase-admin'

function mapAccessErrorToStatus(error: unknown): number {
  const message = error instanceof Error ? error.message : ''
  if (message.startsWith('Unauthorized:')) return 401
  if (message.startsWith('Forbidden:')) return 403
  return 500
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
      completionsResult,
      milestonesResult,
      jobsResult,
    ] = await Promise.all([
      getSupabaseAdmin().from('iv_module_completions').select('id', { count: 'exact', head: true }),
      getSupabaseAdmin().from('iv_reward_milestones').select('status'),
      getSupabaseAdmin().from('iv_payout_jobs').select('status, amount_raw'),
    ])

    if (completionsResult.error) throw new Error(completionsResult.error.message)
    if (milestonesResult.error) throw new Error(milestonesResult.error.message)
    if (jobsResult.error) throw new Error(jobsResult.error.message)

    const milestoneRows = milestonesResult.data ?? []
    const jobRows = jobsResult.data ?? []

    const eligibleMilestones = milestoneRows.filter((row) => (row as { status: string }).status === 'eligible').length

    const queuedPayouts = jobRows.filter((row) => (row as { status: string }).status === 'queued').length
    const processingPayouts = jobRows.filter((row) => (row as { status: string }).status === 'processing').length
    const paidPayouts = jobRows.filter((row) => (row as { status: string }).status === 'paid').length
    const failedPayouts = jobRows.filter((row) => (row as { status: string }).status === 'failed').length

    const totalAmountRawPaid = jobRows
      .filter((row) => (row as { status: string }).status === 'paid')
      .reduce((sum, row) => {
        const amountRaw = (row as { amount_raw: string }).amount_raw
        if (!/^\d+$/.test(amountRaw)) return sum
        return sum + BigInt(amountRaw)
      }, 0n)
      .toString()

    return NextResponse.json({
      totalCompletions: completionsResult.count ?? 0,
      eligibleMilestones,
      queuedPayouts,
      processingPayouts,
      paidPayouts,
      failedPayouts,
      totalAmountRawPaid,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load reward summary'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
