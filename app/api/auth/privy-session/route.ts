import { NextRequest, NextResponse } from 'next/server'
import { requirePrivyUserFromAccessToken } from '@/lib/server/privy-auth'

const SESSION_COOKIE_NAME = 'privy-token'
const LEGACY_SESSION_COOKIE_NAME = 'privy-id-token'
const SESSION_MAX_AGE_SECONDS = 30 * 60

type BearerTokenResult =
  | { ok: true; token: string }
  | { ok: false; reason: 'missing_bearer_token' | 'invalid_authorization_scheme' | 'empty_bearer_token' }

function getBearerToken(req: NextRequest): BearerTokenResult {
  const header = req.headers.get('authorization')
  if (!header) return { ok: false, reason: 'missing_bearer_token' }
  if (!header.startsWith('Bearer ')) return { ok: false, reason: 'invalid_authorization_scheme' }

  const token = header.slice('Bearer '.length).trim()
  if (!token) return { ok: false, reason: 'empty_bearer_token' }

  return { ok: true, token }
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
  const bearerToken = getBearerToken(req)
  if (!bearerToken.ok) {
    return NextResponse.json({ ok: false, reason: bearerToken.reason }, { status: 401 })
  }

  try {
    await requirePrivyUserFromAccessToken(bearerToken.token)
  } catch {
    return NextResponse.json({ ok: false, reason: 'privy_token_verification_failed' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE_NAME, bearerToken.token, cookieOptions(SESSION_MAX_AGE_SECONDS))
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE_NAME, '', cookieOptions(0))
  response.cookies.set(LEGACY_SESSION_COOKIE_NAME, '', cookieOptions(0))
  return response
}
