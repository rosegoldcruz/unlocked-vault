import { redirect } from 'next/navigation'
import { requireAdminAccess } from '@/lib/server/member-access'
import { AdminRewardsDashboard } from '@/components/backoffice/AdminRewardsDashboard'

export const dynamic = 'force-dynamic'

export default async function AdminRewardsPage() {
  try {
    await requireAdminAccess()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Access denied'
    if (message.startsWith('Unauthorized:')) {
      redirect('/')
    }
    redirect('/dashboard')
  }

  return <AdminRewardsDashboard />
}
