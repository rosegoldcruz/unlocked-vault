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
    const statusFilter = req.nextUrl.searchParams.get('status')
    const milestoneFilter = req.nextUrl.searchParams.get('milestone')

    let query = getSupabaseAdmin()
      .from('iv_payout_transactions')
      .select('id, payout_job_id, privy_user_id, milestone_number, wallet_address, token_mint, amount_raw, signature, status, confirmed_at, created_at')
      .order('created_at', { ascending: false })

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    if (milestoneFilter) {
      const milestone = Number(milestoneFilter)
      if (Number.isInteger(milestone)) {
        query = query.eq('milestone_number', milestone)
      }
    }

    const { data, error } = await query

    if (error) throw new Error(error.message)

    return NextResponse.json({ transactions: data ?? [] })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load payout transactions'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
