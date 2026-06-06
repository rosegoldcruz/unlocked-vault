import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAccess } from '@/lib/server/member-access'
import { getSupabaseAdmin } from '@/lib/server/supabase-admin'

function mapAccessErrorToStatus(error: unknown): number {
  const message = error instanceof Error ? error.message : ''
  if (message.startsWith('Unauthorized:')) return 401
  if (message.startsWith('Forbidden:')) return 403
  return 500
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
      .select('id, status')
      .eq('id', id)
      .maybeSingle<{ id: string; status: string }>()

    if (jobError) throw new Error(jobError.message)
    if (!job) return NextResponse.json({ error: 'Payout job not found' }, { status: 404 })
    if (job.status !== 'failed') {
      return NextResponse.json({ error: 'Only failed payout jobs can be retried' }, { status: 400 })
    }

    const { error: updateError } = await getSupabaseAdmin()
      .from('iv_payout_jobs')
      .update({
        status: 'queued',
        last_error: null,
        next_attempt_at: null,
        locked_at: null,
        locked_by: null,
      })
      .eq('id', id)

    if (updateError) throw new Error(updateError.message)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retry payout job'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
