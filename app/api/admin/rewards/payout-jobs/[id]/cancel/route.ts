import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAccess } from '@/lib/server/member-access'
import { getSupabaseAdmin } from '@/lib/server/supabase-admin'

const PROCESSING_STALE_MINUTES = 15

function mapAccessErrorToStatus(error: unknown): number {
  const message = error instanceof Error ? error.message : ''
  if (message.startsWith('Unauthorized:')) return 401
  if (message.startsWith('Forbidden:')) return 403
  return 500
}

function isProcessingJobStale(lockedAt: string | null): boolean {
  if (!lockedAt) return false
  const lockedTime = Date.parse(lockedAt)
  if (Number.isNaN(lockedTime)) return false
  return Date.now() - lockedTime > PROCESSING_STALE_MINUTES * 60 * 1000
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAccess(req)
  } catch (error: unknown) {
    const status = mapAccessErrorToStatus(error)
    const message = error instanceof Error ? error.message : 'Failed to verify admin access'
    return NextResponse.json({ error: message }, { status })
  }

  try {
    const { id } = await context.params

    const { data: job, error: jobError } = await getSupabaseAdmin()
      .from('iv_payout_jobs')
      .select('id, status, locked_at')
      .eq('id', id)
      .maybeSingle<{ id: string; status: string; locked_at: string | null }>()

    if (jobError) throw new Error(jobError.message)
    if (!job) return NextResponse.json({ error: 'Payout job not found' }, { status: 404 })

    if (job.status === 'paid') {
      return NextResponse.json({ error: 'Paid payout jobs cannot be canceled' }, { status: 400 })
    }

    if (job.status === 'processing' && !isProcessingJobStale(job.locked_at)) {
      return NextResponse.json({ error: 'Processing payout jobs can only be canceled when stale' }, { status: 400 })
    }

    if (!['queued', 'failed', 'processing'].includes(job.status)) {
      return NextResponse.json({ error: 'Only queued, failed, or stale processing jobs can be canceled' }, { status: 400 })
    }

    const { error: updateError } = await getSupabaseAdmin()
      .from('iv_payout_jobs')
      .update({
        status: 'canceled',
        locked_at: null,
        locked_by: null,
      })
      .eq('id', id)

    if (updateError) throw new Error(updateError.message)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to cancel payout job'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
