import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/server/supabase-admin'
import { requireEnv } from '@/lib/server/stripe'

const ALL_MODULES = ['module_1', 'module_2', 'module_3', 'module_4', 'module_5', 'module_6'] as const
type StripeModule = typeof ALL_MODULES[number]
const VALID_LEGACY_TIERS = new Set(['ENTRY', 'FOUNDATION', 'BUILDER_ACCELERATOR', 'FOUNDER_ELITE'])
const VALID_ACCESS_TYPES = new Set(['single_module', 'all_modules'])
const VALID_REWARD_TRACKS = new Set(['single_module', 'full_academy'])

// Stripe sends the raw body for signature verification — must not parse as JSON.
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let stripeSecretKey: string
  let webhookSecret: string

  try {
    stripeSecretKey = requireEnv('STRIPE_SECRET_KEY')
    webhookSecret = requireEnv('STRIPE_WEBHOOK_SECRET')
    requireEnv('NEXT_PUBLIC_SUPABASE_URL')
    requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server misconfiguration'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const stripe = new Stripe(stripeSecretKey)
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  // Only process paid completions
  const isFulfillable =
    event.type === 'checkout.session.async_payment_succeeded' ||
    (event.type === 'checkout.session.completed' &&
      (event.data.object as Stripe.Checkout.Session).payment_status === 'paid')

  if (!isFulfillable) {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const meta = session.metadata ?? {}

  const privyUserId = meta.privyUserId ?? meta.userId ?? null
  const legacyTier = meta.legacyTier ?? null
  const accessType = meta.access_type ?? null
  const rewardTrack = meta.reward_track ?? null
  const modulesToUnlockRaw = meta.modulesToUnlock ?? null
  const moduleNumberRaw = meta.module_number ?? null
  const paymentTier = meta.tier ?? null
  const stripePriceId = meta.stripe_price_id ?? null

  const customerEmail = session.customer_details?.email ?? session.customer_email ?? null
  const walletAddress = meta.walletAddress ?? meta.wallet_address ?? null
  const stripeCustomerId = typeof session.customer === 'string' ? session.customer : null
  const stripePaymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null

  // Validate required metadata
  if (!privyUserId || !legacyTier || !accessType || !rewardTrack || !modulesToUnlockRaw) {
    console.error('[webhook] missing required metadata', {
      hasPrivyUserId: Boolean(privyUserId),
      hasLegacyTier: Boolean(legacyTier),
      hasAccessType: Boolean(accessType),
      hasRewardTrack: Boolean(rewardTrack),
      hasModules: Boolean(modulesToUnlockRaw),
    })
    return NextResponse.json({ error: 'Missing required metadata' }, { status: 400 })
  }

  if (!VALID_LEGACY_TIERS.has(legacyTier)) {
    console.error('[webhook] invalid legacy tier', { legacyTier })
    return NextResponse.json({ error: 'Invalid tier metadata' }, { status: 400 })
  }

  if (!VALID_ACCESS_TYPES.has(accessType) || !VALID_REWARD_TRACKS.has(rewardTrack)) {
    console.error('[webhook] invalid access metadata', { accessType, rewardTrack })
    return NextResponse.json({ error: 'Invalid access metadata' }, { status: 400 })
  }

  let parsedModules: string[]
  try {
    parsedModules = JSON.parse(modulesToUnlockRaw)
    if (!Array.isArray(parsedModules)) throw new Error('Not an array')
  } catch {
    console.error('[webhook] failed to parse modulesToUnlock')
    return NextResponse.json({ error: 'Invalid modules metadata' }, { status: 400 })
  }

  const validModules = parsedModules.filter((m): m is StripeModule =>
    (ALL_MODULES as readonly string[]).includes(m)
  )

  if (validModules.length === 0) {
    console.error('[webhook] no valid modules after filtering', { parsedModules })
    return NextResponse.json({ error: 'No valid modules in metadata' }, { status: 400 })
  }

  const moduleNumber = moduleNumberRaw ? Number(moduleNumberRaw) : null

  if (accessType === 'single_module') {
    if (typeof moduleNumber !== 'number' || !Number.isInteger(moduleNumber) || moduleNumber < 1 || moduleNumber > 6) {
      return NextResponse.json({ error: 'Invalid module_number for single_module access' }, { status: 400 })
    }
    if (validModules.length !== 1 || validModules[0] !== `module_${moduleNumber}`) {
      return NextResponse.json({ error: 'Module scope mismatch' }, { status: 400 })
    }
  }

  if (accessType === 'all_modules' && validModules.length !== ALL_MODULES.length) {
    return NextResponse.json({ error: 'Incomplete all_modules scope' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // Idempotency: check if entitlement already exists for this checkout session
  const { data: existing, error: checkError } = await supabase
    .from('iv_member_entitlements')
    .select('id')
    .eq('stripe_checkout_session_id', session.id)
    .maybeSingle<{ id: string }>()

  if (checkError) {
    console.error('[webhook] entitlement check failed', { code: checkError.code })
    return NextResponse.json({ error: 'Entitlement check failed' }, { status: 500 })
  }

  if (existing) {
    // Already processed — return 200 to Stripe so it does not retry
    return NextResponse.json({ received: true, idempotent: true })
  }

  // Write idempotency row to iv_payments (audit trail)
  const { error: paymentError } = await supabase.from('iv_payments').upsert(
    {
      privy_user_id: privyUserId,
      email: customerEmail,
      stripe_customer_id: stripeCustomerId,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: stripePaymentIntentId,
      stripe_event_id: event.id,
      price_id: stripePriceId ?? '',
      tier: paymentTier ?? legacyTier,
      amount_total: session.amount_total,
      currency: session.currency,
      status: 'paid',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_checkout_session_id', ignoreDuplicates: false }
  )

  if (paymentError) {
    // Log and continue — entitlement creation is more critical
    console.error('[webhook] iv_payments upsert failed', { code: paymentError.code, message: paymentError.message })
  }

  // Grant entitlement in iv_member_entitlements
  const entitlementMetadata: Record<string, unknown> = {
    access_type: accessType,
    reward_track: rewardTrack,
    tier: paymentTier,
    legacy_tier: legacyTier,
    stripe_price_id: stripePriceId,
    stripe_session_id: session.id,
    stripe_event_type: event.type,
    provider: 'stripe',
    source: 'member_portal',
  }

  if (moduleNumber !== null) {
    entitlementMetadata.module_number = moduleNumber
  }

  const { error: entitlementError } = await supabase.from('iv_member_entitlements').insert({
    privy_user_id: privyUserId,
    email: customerEmail,
    wallet_address: walletAddress,
    source: 'stripe',
    status: 'active',
    stripe_customer_id: stripeCustomerId,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: stripePaymentIntentId,
    granted_at: new Date().toISOString(),
    metadata: entitlementMetadata,
  })

  if (entitlementError) {
    console.error('[webhook] entitlement insert failed', { code: entitlementError.code, message: entitlementError.message })
    return NextResponse.json({ error: 'Failed to grant entitlement' }, { status: 500 })
  }

  return NextResponse.json({ received: true, entitlementGranted: true })
}
