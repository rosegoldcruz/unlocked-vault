import { NextRequest, NextResponse } from 'next/server'
import { requirePrivyUser } from '@/lib/server/privy-auth'
import { getSupabaseAdmin } from '@/lib/server/supabase-admin'
import { ensureUserProfile } from '@/lib/backoffice-profile'
import type { UserPosition } from '@/types/backoffice'

async function ensurePositionRow(privyUserId: string): Promise<UserPosition> {
  const supabase = getSupabaseAdmin()
  const { data: existing, error: readError } = await supabase.from('iv_user_positions').select('*').eq('privy_user_id', privyUserId).maybeSingle<UserPosition>()
  if (readError) throw readError
  if (existing) return existing
  const { data, error } = await supabase.from('iv_user_positions').insert({ privy_user_id: privyUserId }).select('*').single<UserPosition>()
  if (error) throw error
  return data
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePrivyUser(req)
    await ensureUserProfile(auth.privyUserId, { email: auth.email, walletAddress: auth.walletAddress })
    const position = await ensurePositionRow(auth.privyUserId)
    return NextResponse.json({ position })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load positions'
    const status = message.startsWith('Unauthorized') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
