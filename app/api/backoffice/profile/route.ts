import { NextRequest, NextResponse } from 'next/server'
import { requirePrivyUser } from '@/lib/server/privy-auth'
import { ensureUserProfile } from '@/lib/backoffice-profile'

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePrivyUser(req)
    const profile = await ensureUserProfile(auth.privyUserId, { email: auth.email, walletAddress: auth.walletAddress })
    return NextResponse.json({ profile })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load profile'
    const status = message.startsWith('Unauthorized') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
