import { NextRequest, NextResponse } from 'next/server'
import { requirePrivyUser } from '@/lib/server/privy-auth'
import { getSupabaseAdmin } from '@/lib/server/supabase-admin'
import { ensureUserProfile } from '@/lib/backoffice-profile'
import type { ReferralLead } from '@/types/backoffice'

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePrivyUser(req)
    await ensureUserProfile(auth.privyUserId, { email: auth.email, walletAddress: auth.walletAddress })
    const { data, error } = await getSupabaseAdmin().from('iv_referral_leads').select('*').eq('privy_user_id', auth.privyUserId).order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ referrals: (data ?? []) as ReferralLead[] })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load referrals'
    const status = message.startsWith('Unauthorized') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePrivyUser(req)
    await ensureUserProfile(auth.privyUserId, { email: auth.email, walletAddress: auth.walletAddress })
    const body = await req.json()
    if (!isNonEmptyString(body?.name)) return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 })
    if (!isNonEmptyString(body?.phone)) return NextResponse.json({ error: 'Missing required field: phone' }, { status: 400 })
    const payload = {
      privy_user_id: auth.privyUserId,
      name: body.name.trim(),
      phone: body.phone.trim(),
      relationship: isNonEmptyString(body?.relationship) ? body.relationship.trim() : null,
      best_time_to_call: isNonEmptyString(body?.bestTimeToCall) ? body.bestTimeToCall.trim() : null,
      profession: isNonEmptyString(body?.profession) ? body.profession.trim() : null,
      link_sent: Boolean(body?.linkSent),
      status: 'NEW',
    }
    const { data, error } = await getSupabaseAdmin().from('iv_referral_leads').insert(payload).select('*').single<ReferralLead>()
    if (error) throw error
    return NextResponse.json({ referral: data }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create referral'
    const status = message.startsWith('Unauthorized') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
