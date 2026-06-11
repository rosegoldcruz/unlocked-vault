import { VIPGate } from '@/components/gates/VIPGate'
import { VIPPartnerPage } from '@/components/backoffice/VIPPartnerPage'

export const dynamic = 'force-dynamic'

export default function VIPPage() {
  return (
    <section className="space-y-6">
      <VIPGate>
        <VIPPartnerPage />
      </VIPGate>
    </section>
  )
}
