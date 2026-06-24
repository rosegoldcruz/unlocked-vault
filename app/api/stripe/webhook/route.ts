import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/server/supabase-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type MemberEntitlementRow = {
  id: string
  status: 'active' | 'revoked' | 'expired'
}

type StripeMode = 'live' | 'test' | 'unknown'

const HANDLED_EVENTS = new Set(['checkout.session.completed'])

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

function getStripeMode(secretKey: string): StripeMode {
  if (secretKey.startsWith('sk_live_')) return 'live'
  if (secretKey.startsWith('sk_test_')) return 'test'
  return 'unknown'
}

function getStripeClient(): { stripe: Stripe; mode: StripeMode } {
  const secretKey = requireEnv('STRIPE_SECRET_KEY')
  return {
    stripe: new Stripe(secretKey),
    mode: getStripeMode(secretKey),
  }
}

function isMissingEnvError(error: unknown): error is Error {
  return error instanceof Error && error.message.startsWith('Missing required env var:')
}

function getString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function getBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  if (normalized === 'true') return true
  if (normalized === 'false') return false
  return null
}

function getModuleNumber(value: unknown): number | null {
  const numberValue = typeof value === 'number' ? value : Number(getString(value))
  if (!Number.isInteger(numberValue) || numberValue < 1 || numberValue > 6) return null
  return numberValue
}

function removeUndefinedValues(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined && value !== null))
}

function getPriceId(session: Stripe.Checkout.Session): string | null {
  const metadataPriceId = getString(session.metadata?.stripe_price_id)
  if (metadataPriceId) return metadataPriceId

  const lineItems = session.line_items?.data ?? []
  for (const item of lineItems) {
    const price = item.price
    if (price?.id) return price.id
  }

  return null
}

function getPaymentIntentId(session: Stripe.Checkout.Session): string | null {
  const paymentIntent = session.payment_intent
  if (typeof paymentIntent === 'string') return paymentIntent
  return paymentIntent?.id ?? null
}

function getCustomerId(session: Stripe.Checkout.Session): string | null {
  const customer = session.customer
  if (typeof customer === 'string') return customer
  return customer?.id ?? null
}

function getEmail(session: Stripe.Checkout.Session): string | null {
  return getString(session.metadata?.email)
    ?? getString(session.customer_details?.email)
    ?? getString(session.customer_email)
}

function getPrivyUserId(session: Stripe.Checkout.Session): string | null {
  return getString(session.metadata?.privyUserId)
    ?? getString(session.metadata?.privy_user_id)
    ?? getString(session.metadata?.userId)
    ?? getString(session.client_reference_id)
}

function getWalletAddress(session: Stripe.Checkout.Session): string | null {
  return getString(session.metadata?.walletAddress) ?? getString(session.metadata?.wallet_address)
}

function getAccessType(session: Stripe.Checkout.Session): 'single_module' | 'all_modules' {
  const accessType = getString(session.metadata?.access_type)
  if (accessType === 'single_module' || accessType === 'all_modules') return accessType
  throw new Error('Checkout session missing valid access_type metadata')
}

function getRewardTrack(session: Stripe.Checkout.Session): 'single_module' | 'full_academy' {
  const rewardTrack = getString(session.metadata?.reward_track)
  if (rewardTrack === 'single_module' || rewardTrack === 'full_academy') return rewardTrack
  throw new Error('Checkout session missing valid reward_track metadata')
}

async function updatePaymentRecordIfPresent(session: Stripe.Checkout.Session, privyUserId: string | null) {
  const { data, error } = await getSupabaseAdmin()
    .from('iv_payments')
    .select('id')
    .eq('provider_session_id', session.id)
    .limit(1)

  if (error) throw error
  if (!data?.[0]) return

  const { error: updateError } = await getSupabaseAdmin()
    .from('iv_payments')
    .update({
      paid: true,
      status: 'paid',
      confirmed_at: new Date().toISOString(),
      privy_user_id: privyUserId,
    })
    .eq('id', data[0].id)

  if (updateError) throw updateError
}

async function grantMemberEntitlement(stripe: Stripe, event: Stripe.Event, sessionFromEvent: Stripe.Checkout.Session) {
  const session = await stripe.checkout.sessions.retrieve(sessionFromEvent.id, {
    expand: ['line_items.data.price'],
  })

  if (session.payment_status !== 'paid') {
    return { status: 'skipped_not_paid' }
  }

  const privyUserId = getPrivyUserId(session)
  const email = getEmail(session)
  const walletAddress = getWalletAddress(session)

  if (!privyUserId && !email && !walletAddress) {
    throw new Error('Checkout session missing member identity metadata')
  }

  const { data: existing, error: existingError } = await getSupabaseAdmin()
    .from('iv_member_entitlements')
    .select('id,status')
    .eq('stripe_checkout_session_id', session.id)
    .limit(1)

  if (existingError) throw existingError
  if (existing?.[0]) {
    await updatePaymentRecordIfPresent(session, privyUserId)
    return { status: 'already_fulfilled', entitlementId: (existing[0] as MemberEntitlementRow).id }
  }

  const accessType = getAccessType(session)
  const rewardTrack = getRewardTrack(session)
  const moduleNumber = accessType === 'single_module' ? getModuleNumber(session.metadata?.module_number) : null

  if (accessType === 'single_module' && !moduleNumber) {
    throw new Error('Checkout session missing valid module_number metadata')
  }

  const metadata = removeUndefinedValues({
    provider: 'stripe',
    stripe_event_id: event.id,
    stripe_event_type: event.type,
    stripe_session_id: session.id,
    stripe_price_id: getPriceId(session),
    access_type: accessType,
    reward_track: rewardTrack,
    module_number: moduleNumber,
    tier: getString(session.metadata?.tier),
    payment_tier: getString(session.metadata?.payment_tier) ?? getString(session.metadata?.paymentTier),
    legacy_tier: getString(session.metadata?.legacy_tier) ?? getString(session.metadata?.legacyTier),
    internal_test: getBoolean(session.metadata?.internal_test),
  })

  const { data: entitlement, error: insertError } = await getSupabaseAdmin()
    .from('iv_member_entitlements')
    .insert({
      privy_user_id: privyUserId,
      email,
      wallet_address: walletAddress,
      source: 'stripe',
      status: 'active',
      stripe_customer_id: getCustomerId(session),
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: getPaymentIntentId(session),
      metadata,
    })
    .select('id')
    .single<{ id: string }>()

  if (insertError) {
    if (insertError.code === '23505') {
      const { data: duplicate, error: duplicateError } = await getSupabaseAdmin()
        .from('iv_member_entitlements')
        .select('id,status')
        .eq('stripe_checkout_session_id', session.id)
        .limit(1)

      if (duplicateError) throw duplicateError
      if (duplicate?.[0]) {
        await updatePaymentRecordIfPresent(session, privyUserId)
        return { status: 'already_fulfilled', entitlementId: (duplicate[0] as MemberEntitlementRow).id }
      }
    }

    throw insertError
  }

  await updatePaymentRecordIfPresent(session, privyUserId)
  return { status: 'fulfilled', entitlementId: entitlement.id }
}

export async function GET() {
  return new Response(null, {
    status: 405,
    headers: { Allow: 'POST' },
  })
}

export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let stripe: Stripe
  let mode: StripeMode
  let webhookSecret: string

  try {
    const client = getStripeClient()
    stripe = client.stripe
    mode = client.mode
    webhookSecret = requireEnv('STRIPE_WEBHOOK_SECRET')
    requireEnv('NEXT_PUBLIC_SUPABASE_URL')
    requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  } catch (error: unknown) {
    const message = isMissingEnvError(error) ? error.message : 'Stripe webhook configuration error'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const body = await req.text()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid stripe webhook signature' }, { status: 400 })
  }

  if ((mode === 'live' && !event.livemode) || (mode === 'test' && event.livemode)) {
    return NextResponse.json({ error: 'Stripe event mode does not match configured Stripe secret key mode' }, { status: 400 })
  }

  if (!HANDLED_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true, ignored: true, eventType: event.type })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const result = await grantMemberEntitlement(stripe, event, event.data.object as Stripe.Checkout.Session)
      return NextResponse.json({ received: true, handled: true, eventType: event.type, result: result.status })
    }

    return NextResponse.json({ received: true, ignored: true, eventType: event.type })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Stripe webhook handling failed'
    if (isMissingEnvError(error)) {
      return NextResponse.json({ error: message }, { status: 500 })
    }

    return NextResponse.json({ error: 'Stripe webhook handling failed' }, { status: 500 })
  }
}
