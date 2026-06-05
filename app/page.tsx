import { redirect } from 'next/navigation'
import RootEntryPage from '@/app/root-entry-page'
import { requireMemberAccess } from '@/lib/server/member-access'

export const dynamic = 'force-dynamic'

export default async function RootPage() {
  try {
    await requireMemberAccess()
    redirect('/dashboard')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Access denied'
    if (message.startsWith('Forbidden:')) {
      redirect('/access-required')
    }
  }

  return <RootEntryPage />
}
