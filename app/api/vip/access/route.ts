import { createHash, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { requireMemberAccess } from '@/lib/server/member-access'

const VIP_ACCESS_COOKIE = 'iv_vip_access'

function getVipAccessCode(): string {
  return (process.env.IRON_VAULT_VIP_ACCESS_CODE ?? '').trim()
}

function hashCode(code: string): string {
  return createHash('sha256').update(`iron-vault-vip:${code}`).digest('hex')
}

function safeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  if (leftBuffer.length !== rightBuffer.length) return false
  return timingSafeEqual(leftBuffer, rightBuffer)
}

function hasValidVipCookie(req: NextRequest): boolean {
  const accessCode = getVipAccessCode()
  const cookieValue = req.cookies.get(VIP_ACCESS_COOKIE)?.value
  if (!accessCode || !cookieValue) return false
  return safeEquals(cookieValue, hashCode(accessCode))
}

function accessErrorResponse(error: unknown): NextResponse | null {
  const message = error instanceof Error ? error.message : 'Access denied'
  if (message.startsWith('Unauthorized:')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (message.startsWith('Forbidden:')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function GET(req: NextRequest) {
  try {
    await requireMemberAccess(req)

    const configured = getVipAccessCode().length > 0
    return NextResponse.json({
      configured,
      unlocked: configured ? hasValidVipCookie(req) : false,
    })
  } catch (error) {
    return accessErrorResponse(error) ?? NextResponse.json({ error: 'Failed to verify VIP access.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireMemberAccess(req)

    const accessCode = getVipAccessCode()

    if (!accessCode) {
      return NextResponse.json({ error: 'VIP access code is not configured.' }, { status: 503 })
    }

    const body = await req.json().catch(() => null)
    const submittedCode = typeof body?.code === 'string' ? body.code.trim() : ''

    if (!submittedCode) {
      return NextResponse.json({ error: 'Enter your VIP access code.' }, { status: 400 })
    }

    if (!safeEquals(submittedCode, accessCode)) {
      return NextResponse.json({ error: 'Invalid VIP access code.' }, { status: 403 })
    }

    const response = NextResponse.json({ status: 'unlocked' }, { status: 200 })
    response.cookies.set({
      name: VIP_ACCESS_COOKIE,
      value: hashCode(accessCode),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 12,
    })
    return response
  } catch (error) {
    return accessErrorResponse(error) ?? NextResponse.json({ error: 'Failed to unlock VIP access.' }, { status: 500 })
  }
}
