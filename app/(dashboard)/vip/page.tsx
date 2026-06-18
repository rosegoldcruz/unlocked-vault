import { VIPGate } from '@/components/gates/VIPGate'
import { VIPPartnerPage } from '@/components/backoffice/VIPPartnerPage'

export const dynamic = 'force-dynamic'

export default function VIPPage() {
  const videoSrc = process.env.NEXT_PUBLIC_IRON_VAULT_VIP_VIDEO_SRC?.trim()

  return (
    <section className="space-y-6">
      <VIPGate>
        <VIPPartnerPage videoSrc={videoSrc} />
      </VIPGate>
    </section>
  )
}
