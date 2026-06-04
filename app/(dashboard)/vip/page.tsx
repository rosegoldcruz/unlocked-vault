import { VIPGate } from '@/components/gates/VIPGate'

export const dynamic = 'force-dynamic'

export default function VIPPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-purple-400 mb-1">Premium Access</p>
        <h1 className="text-3xl font-semibold text-zinc-100">VIP</h1>
      </div>
      <VIPGate>
        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-purple-300 mb-3">VIP Area</p>
          <h2 className="text-2xl font-semibold text-zinc-100 mb-2">VIP Member Access</h2>
          <p className="text-zinc-400">Welcome to the Iron Vault VIP area. Exclusive content and benefits are available here.</p>
        </div>
      </VIPGate>
    </section>
  )
}
