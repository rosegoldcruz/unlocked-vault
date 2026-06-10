import { runRewardPayoutWorker } from '@/lib/server/reward-payout-worker'

const payoutJobId = process.argv[2]

async function main() {
  if (!payoutJobId) throw new Error('Usage: npm run rewards:dry-run -- <payout_job_id>')
  if (String(process.env.IVT_PAYOUT_DRY_RUN || '').trim().toLowerCase() !== 'true') {
    throw new Error('IVT_PAYOUT_DRY_RUN must be true')
  }

  const result = await runRewardPayoutWorker({ payoutJobId })
  console.log('PAYOUT_DRY_RUN_COMPLETE=yes')
  console.log('processed_count=' + result.processedCount)
  console.log('target_job_processed=' + (result.processed.some((item) => item.jobId === payoutJobId) ? 'yes' : 'no'))
}

main().catch((error: unknown) => {
  console.error('BLOCKER:', error instanceof Error ? error.message : String(error))
  process.exit(1)
})