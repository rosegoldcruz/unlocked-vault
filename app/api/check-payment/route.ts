import { NextRequest, NextResponse } from 'next/server'
import { getMemberAccessScope } from '@/lib/server/member-access'

export async function GET(req: NextRequest) {
  try {
    const scope = await getMemberAccessScope(req)
    return NextResponse.json({
      hasPaid: true,
      entitled: true,
      scope,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    if (message.startsWith('Unauthorized:')) {
      return NextResponse.json({ error: message }, { status: 401 })
    }
    if (message.startsWith('Forbidden:')) {
      return NextResponse.json({ hasPaid: false, entitled: false }, { status: 403 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
