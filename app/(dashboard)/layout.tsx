import type { ReactNode } from 'react'
import Providers from '@/app/providers'
import { BackofficeProvider } from '@/components/backoffice/BackofficeProvider'
import { BackofficeLayout } from '@/components/backoffice/BackofficeLayout'

export const dynamic = 'force-dynamic'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <BackofficeProvider>
        <BackofficeLayout>{children}</BackofficeLayout>
      </BackofficeProvider>
    </Providers>
  )
}
