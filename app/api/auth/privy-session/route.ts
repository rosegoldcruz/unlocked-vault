import { NextRequest, NextResponse } from 'next/server'
import { requirePrivyUserFromAccessToken } from '@/lib/server/privy-auth'

const SESSION_COOKIE_NAME = 'privy-token'
const LEGACY_SESSION_COOKIE_NAME = 'privy-id-token'
const SESSION_MAX_AGE_SECONDS = 30 * 60

function getBearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization')
  if (!header || !header.startsWith('Bearer ')) return null

  const token = header.slice('Bearer '.length).trim()
  return token.length > 0 ? token : null
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }
}

export async function POST(req: NextRequest) {
  const token = getBearerToken(req)
  if (!token) {
    return NextResponse.json({ ok: false, reason: 'missing_bearer_token' }, { status: 401 })
  }

  try {
    await requirePrivyUserFromAccessToken(token)
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_bearer_token' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE_NAME, token, cookieOptions(SESSION_MAX_AGE_SECONDS))
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE_NAME, '', cookieOptions(0))
  response.cookies.set(LEGACY_SESSION_COOKIE_NAME, '', cookieOptions(0))
  return response
}
