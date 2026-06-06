import { sendTokenRewardPayout, validatePayoutTransferConfig } from '@/lib/server/solana-payout'

function readRequired(name: string): string {
  const value = process.env[name]
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var for dry run: ${name}`)
  }
  return value.trim()
}

async function main() {
  const config = validatePayoutTransferConfig()

  console.log('[rewards:payout:dry-run] payoutWorkerEnabled=', config.payoutWorkerEnabled)
  console.log('[rewards:payout:dry-run] payoutDryRun=', config.dryRun)
  console.log('[rewards:payout:dry-run] tokenMint=', config.tokenMint.toBase58())
  console.log('[rewards:payout:dry-run] rewardWallet=', config.rewardWalletPublicKey.toBase58())

  if (!config.dryRun) {
    throw new Error('Expected IVT_PAYOUT_DRY_RUN=true for this script')
  }

  const destinationWalletAddress = readRequired('IVT_DRY_RUN_DESTINATION_WALLET')
  const amountRaw = readRequired('IVT_DRY_RUN_AMOUNT_RAW')

  const result = await sendTokenRewardPayout({
    destinationWalletAddress,
    amountRaw,
  })

  console.log('[rewards:payout:dry-run] result=', JSON.stringify(result, null, 2))
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error('[rewards:payout:dry-run] failed:', message)
  process.exit(1)
})
