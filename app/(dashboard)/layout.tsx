import type { ReactNode } from 'react'
import { BackofficeProvider } from '@/components/backoffice/BackofficeProvider'
import { BackofficeLayout } from '@/components/backoffice/BackofficeLayout'

export const dynamic = 'force-dynamic'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <BackofficeProvider>
      <BackofficeLayout>{children}</BackofficeLayout>
    </BackofficeProvider>
  )
}
