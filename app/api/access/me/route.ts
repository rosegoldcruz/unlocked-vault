import { NextRequest, NextResponse } from 'next/server'
import { getMemberAccessScope, requireMemberAccess } from '@/lib/server/member-access'

function mapAccessErrorToStatus(error: unknown): number {
  const message = error instanceof Error ? error.message : ''
  if (message.startsWith('Unauthorized:')) return 401
  if (message.startsWith('Forbidden:')) return 403
  return 500
}

export async function GET(req: NextRequest) {
  try {
    await requireMemberAccess(req)
    const scope = await getMemberAccessScope(req)
    return NextResponse.json({ authenticated: true, entitled: true, scope })
  } catch (error: unknown) {
    const status = mapAccessErrorToStatus(error)

    if (status === 403) {
      return NextResponse.json({ authenticated: true, entitled: false }, { status })
    }

    if (status === 401) {
      return NextResponse.json({ authenticated: false, entitled: false }, { status })
    }

    return NextResponse.json({ authenticated: false, entitled: false }, { status: 500 })
  }
}
