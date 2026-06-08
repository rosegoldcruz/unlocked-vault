import { runRewardPayoutWorker } from '@/lib/server/reward-payout-worker'

function readIntervalMs(): number {
  const value = process.env.IVT_PAYOUT_WORKER_INTERVAL_MS
  if (!value) return 30_000

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 5_000) {
    throw new Error('Invalid IVT_PAYOUT_WORKER_INTERVAL_MS: expected number >= 5000')
  }

  return parsed
}

async function runOnce() {
  const payoutJobId = process.argv[3] ?? process.env.IVT_PAYOUT_JOB_ID
  const result = await runRewardPayoutWorker({ payoutJobId })
  console.log('[rewards:worker] processedCount=', result.processedCount)
  console.log('[rewards:worker] processed=', JSON.stringify(result.processed))
}

async function main() {
  const mode = process.argv[2] ?? 'once'
  if (mode === 'once') {
    await runOnce()
    return
  }

  if (mode !== 'loop') {
    throw new Error('Usage: tsx scripts/reward-payout-worker.ts [once|loop] [payout_job_id]')
  }

  if (process.argv[3] || process.env.IVT_PAYOUT_JOB_ID) {
    throw new Error('payout_job_id scoping is only supported in once mode')
  }

  const intervalMs = readIntervalMs()
  console.log('[rewards:worker] loop mode started, intervalMs=', intervalMs)

  for (;;) {
    try {
      await runOnce()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('[rewards:worker] run failed:', message)
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, intervalMs)
    })
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error('[rewards:worker] fatal:', message)
  process.exit(1)
})
