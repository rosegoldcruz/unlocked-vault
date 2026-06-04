import { NextRequest, NextResponse } from 'next/server'
import { requirePrivyUser } from '@/lib/server/privy-auth'
import { getSupabaseAdmin } from '@/lib/server/supabase-admin'
import { ensureUserProfile } from '@/lib/backoffice-profile'
import type { StatusTicket } from '@/types/backoffice'

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePrivyUser(req)
    await ensureUserProfile(auth.privyUserId, { email: auth.email, walletAddress: auth.walletAddress })
    const { data, error } = await getSupabaseAdmin().from('iv_status_tickets').select('*').eq('privy_user_id', auth.privyUserId).order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ tickets: (data ?? []) as StatusTicket[] })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load tickets'
    const status = message.startsWith('Unauthorized') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePrivyUser(req)
    await ensureUserProfile(auth.privyUserId, { email: auth.email, walletAddress: auth.walletAddress })
    const body = await req.json()
    if (!isNonEmptyString(body?.subject)) return NextResponse.json({ error: 'Missing required field: subject' }, { status: 400 })
    if (!isNonEmptyString(body?.message)) return NextResponse.json({ error: 'Missing required field: message' }, { status: 400 })
    const payload = {
      privy_user_id: auth.privyUserId,
      name: isNonEmptyString(body?.name) ? body.name.trim() : null,
      email: auth.email,
      subject: body.subject.trim(),
      message: body.message.trim(),
      status: 'PENDING',
      last_update: new Date().toISOString(),
    }
    const { data, error } = await getSupabaseAdmin().from('iv_status_tickets').insert(payload).select('*').single<StatusTicket>()
    if (error) throw error
    return NextResponse.json({ ticket: data }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create ticket'
    const status = message.startsWith('Unauthorized') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
