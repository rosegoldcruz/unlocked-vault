import { getSupabaseAdmin } from '@/lib/server/supabase-admin'

const target = process.argv[2]

function assertTarget() {
  if (!target) throw new Error('Usage: npm run verify:payment-chain -- <privy_user_id|stripe_checkout_session_id|payout_job_id>')
}

async function main() {
  assertTarget()
  const supabase = getSupabaseAdmin()

  const { data: payments, error: paymentError } = await supabase
    .from('iv_payments')
    .select('id, privy_user_id, provider_session_id, paid, status, modules_unlocked')
    .or(`privy_user_id.eq.${target},provider_session_id.eq.${target}`)
    .limit(10)
  if (paymentError) throw paymentError

  const privyUserId = payments?.[0]?.privy_user_id ?? target

  const { data: entitlements, error: entitlementError } = await supabase
    .from('iv_member_entitlements')
    .select('id, privy_user_id, status, stripe_checkout_session_id, metadata')
    .or(`privy_user_id.eq.${privyUserId},stripe_checkout_session_id.eq.${target}`)
    .limit(10)
  if (entitlementError) throw entitlementError

  const { data: payoutJobs, error: payoutJobError } = await supabase
    .from('iv_payout_jobs')
    .select('id, privy_user_id, status, wallet_address, token_mint, amount_raw')
    .or(`privy_user_id.eq.${privyUserId},id.eq.${target}`)
    .limit(10)
  if (payoutJobError) throw payoutJobError

  console.log('PAYMENT_CHAIN_CHECKED=yes')
  console.log('payments_found=' + ((payments ?? []).length > 0 ? 'yes' : 'no'))
  console.log('entitlements_found=' + ((entitlements ?? []).length > 0 ? 'yes' : 'no'))
  console.log('payout_jobs_found=' + ((payoutJobs ?? []).length > 0 ? 'yes' : 'no'))
}

main().catch((error: unknown) => {
  console.error('BLOCKER:', error instanceof Error ? error.message : String(error))
  process.exit(1)
})