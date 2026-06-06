import { NextRequest, NextResponse } from 'next/server'
import { getRewardConfig } from '@/lib/server/reward-config'
import { runRewardPayoutWorker } from '@/lib/server/reward-payout-worker'

function requireWorkerSecret(req: NextRequest): void {
  const expected = process.env.IVT_PAYOUT_WORKER_SECRET
  if (!expected || !expected.trim()) {
    throw new Error('Missing required env var: IVT_PAYOUT_WORKER_SECRET')
  }

  const provided = req.headers.get('x-ivt-worker-secret')
  if (provided !== expected) {
    throw new Error('Unauthorized: invalid worker secret')
  }
}

export async function POST(req: NextRequest) {
  try {
    requireWorkerSecret(req)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unauthorized'
    const status = message.startsWith('Unauthorized:') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }

  try {
    const config = getRewardConfig()
    if (!config.payoutWorkerEnabled) {
      return NextResponse.json({ error: 'Payout worker is disabled by configuration' }, { status: 400 })
    }

    const result = await runRewardPayoutWorker()
    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to run payout worker'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
