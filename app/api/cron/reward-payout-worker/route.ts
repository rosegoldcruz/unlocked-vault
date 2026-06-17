import { NextRequest, NextResponse } from 'next/server'
import { runRewardPayoutWorker } from '@/lib/server/reward-payout-worker'

function requireCronSecret(req: NextRequest): void {
  const expected = process.env.CRON_SECRET
  if (!expected || !expected.trim()) {
    throw new Error('Missing required env var: CRON_SECRET')
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
    return NextResponse.json({ error: message }, { status })
  }

  try {
    const result = await runRewardPayoutWorker()
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to run payout worker' }, { status: 500 })
  }
}
