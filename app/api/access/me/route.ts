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
    return NextResponse.json({
      authenticated: true,
      hasFullAcademy: scope.coreAcademyAccess === 'FULL',
      package: scope.package === 'ENTRY_LEVEL' ? 'Entry-Level' : scope.package[0] + scope.package.slice(1).toLowerCase(),
      developerLabAccess: scope.developerLabAccess,
      scope: {
        allowedModules: scope.allowedModules,
        accessType: scope.accessType,
        package: scope.package === 'ENTRY_LEVEL' ? 'Entry-Level' : scope.package[0] + scope.package.slice(1).toLowerCase(),
        coreAcademyAccess: scope.coreAcademyAccess,
        developerLabAccess: scope.developerLabAccess,
      },
    })
  } catch (error: unknown) {
    const status = mapAccessErrorToStatus(error)

    if (status === 403) {
      return NextResponse.json({ authenticated: true, hasFullAcademy: false, package: 'Entry-Level' }, { status })
    }

    if (status === 401) {
      return NextResponse.json({ authenticated: false, hasFullAcademy: false }, { status })
    }

    return NextResponse.json({ authenticated: false, hasFullAcademy: false }, { status: 500 })
  }
}
