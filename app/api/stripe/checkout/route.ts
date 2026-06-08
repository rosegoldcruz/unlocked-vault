import { NextRequest, NextResponse } from 'next/server'
import { requirePrivyUser } from '@/lib/server/privy-auth'
import { getStripe, getTierConfig, requireEnv } from '@/lib/server/stripe'

export async function POST(req: NextRequest) {
  let stripeSecretKey: string
  let baseUrl: string

  try {
    stripeSecretKey = requireEnv('STRIPE_SECRET_KEY')
    baseUrl = requireEnv('NEXT_PUBLIC_BASE_URL')
    requireEnv('STRIPE_WEBHOOK_SECRET')
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server misconfiguration'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  let auth: Awaited<ReturnType<typeof requirePrivyUser>>
  try {
    auth = await requirePrivyUser(req)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { tier } = body
  const config = getTierConfig(tier)
  if (!config) {
    return NextResponse.json({ error: `Invalid tier: ${String(tier)}` }, { status: 400 })
  }

  let priceId: string
  try {
    priceId = requireEnv(config.priceEnv)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Price not configured'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  let moduleNumber: number | null = null
  let modulesToUnlock: string[]

  if (config.requiresModuleNumber) {
    const moduleNum = Number(body.module_number)
    if (!Number.isInteger(moduleNum) || moduleNum < 1 || moduleNum > 6) {
      return NextResponse.json({ error: 'ENTRY tier requires a valid module_number (1–6)' }, { status: 400 })
    }
    moduleNumber = moduleNum
    modulesToUnlock = [`module_${moduleNum}`]
  } else {
    modulesToUnlock = 'modulesToUnlock' in config ? [...config.modulesToUnlock] : []
  }

  const successUrl = `${baseUrl}/dashboard`
  const cancelUrl = `${baseUrl}/access-required`

  const metadata: Record<string, string> = {
    userId: auth.privyUserId,
    privyUserId: auth.privyUserId,
    tier: config.paymentTier,
    legacyTier: String(tier),
    modulesToUnlock: JSON.stringify(modulesToUnlock),
    access_type: config.accessType,
    reward_track: config.rewardTrack,
    stripe_price_id: priceId,
    source: 'member_portal',
  }

  if (moduleNumber !== null) metadata.module_number = String(moduleNumber)
  if (auth.email) metadata.email = auth.email
  if (auth.walletAddress) metadata.walletAddress = auth.walletAddress

  try {
    const stripe = getStripe()
    void stripeSecretKey // used via getStripe()

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: auth.privyUserId,
      customer_email: auth.email ?? undefined,
      metadata,
    })

    return NextResponse.json({ url: session.url })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to create checkout session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
