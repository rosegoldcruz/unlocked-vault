import { getSupabaseAdmin } from '@/lib/server/supabase-admin'
import { getPrivySolanaWalletForUser, isValidSolanaPublicKey } from '@/lib/server/ivt-solana-wallet'

const payoutJobId = process.argv[2]

async function main() {
  if (!payoutJobId) throw new Error('Usage: npm run repair:payout-wallet -- <payout_job_id>')

  const supabase = getSupabaseAdmin()
  const { data: job, error } = await supabase
    .from('iv_payout_jobs')
    .select('id, privy_user_id, status, wallet_address')
    .eq('id', payoutJobId)
    .maybeSingle<{ id: string; privy_user_id: string; status: string; wallet_address: string | null }>()
  if (error) throw error
  if (!job) throw new Error('Target payout job not found')

  const wallet = await getPrivySolanaWalletForUser(job.privy_user_id)
  if (!isValidSolanaPublicKey(wallet)) throw new Error('No valid Solana wallet found in Privy')

  const { error: updateError } = await supabase
    .from('iv_payout_jobs')
    .update({ wallet_address: wallet })
    .eq('id', payoutJobId)
  if (updateError) throw updateError

  console.log('PAYOUT_WALLET_REPAIRED=yes')
  console.log('target_job_found=yes')
  console.log('valid_solana_wallet_found=yes')
}

main().catch((error: unknown) => {
  console.error('BLOCKER:', error instanceof Error ? error.message : String(error))
  process.exit(1)
})