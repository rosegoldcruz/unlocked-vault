import { NextRequest, NextResponse } from 'next/server'
import { runRewardPayoutWorker } from '@/lib/server/reward-payout-worker'

function requireCronSecret(req: NextRequest): void {
  const expected = process.env.CRON_SECRET
  if (!expected || !expected.trim()) {
    throw new Error('Cron secret is not configured')
  }

  const provided = req.headers.get('authorization')
  if (provided !== `Bearer ${expected}`) {
    throw new Error('Unauthorized')
  }
}

export async function GET(req: NextRequest) {
  try {
    requireCronSecret(req)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unauthorized'
    const status = message === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: status === 401 ? 'Unauthorized' : message }, { status })
  }

  try {
    const result = await runRewardPayoutWorker()
    return NextResponse.json({
      processedCount: result.processedCount,
      processed: result.processed.map((job) => ({
        jobId: job.jobId,
        status: job.status,
        signatureExists: Boolean(job.signature),
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to run payout worker' }, { status: 500 })
  }
}
