import { VIPGate } from '@/components/gates/VIPGate'

export const dynamic = 'force-dynamic'

export default function VIPPage() {
  return (
    <section className="space-y-6">
      <div className="iv-panel p-6">
        <p className="iv-label mb-1 text-purple-400">Premium Access</p>
        <h1 className="iv-title text-5xl">VIP</h1>
      </div>
      <VIPGate>
        <div className="iv-panel p-6">
          <p className="iv-label mb-3 text-purple-300">VIP Area</p>
          <h2 className="iv-card-title mb-2 text-3xl">VIP Member Access</h2>
          <p className="iv-body">Welcome to the Iron Vault VIP area. Exclusive content and benefits are available here.</p>
        </div>
      </VIPGate>
    </section>
  )
}
