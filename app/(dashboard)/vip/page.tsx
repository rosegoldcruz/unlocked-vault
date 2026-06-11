import { VIPGate } from '@/components/gates/VIPGate'
import { Building2, Handshake, Rocket, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

const vipCards = [
  {
    title: 'Strategic Partner Review',
    description: 'Qualified members can submit projects, opportunities, or partnership concepts for Iron Vault review.',
    icon: Handshake,
  },
  {
    title: 'Token Launch Support',
    description: 'Explore structured support for qualified projects involving education, community awareness, and digital asset strategy.',
    icon: Rocket,
  },
  {
    title: 'Real-World Asset Opportunities',
    description: 'VIP members gain visibility into future ecosystem discussions around real estate, infrastructure, and tokenized participation.',
    icon: Building2,
  },
  {
    title: 'Priority Access',
    description: 'VIP members receive elevated access to updates, private opportunities, and strategic ecosystem developments.',
    icon: ShieldCheck,
  },
]

export default function VIPPage() {
  return (
    <section className="space-y-6">
      <VIPGate>
        <section className="space-y-6">
          <div className="iv-panel p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
              <div>
                <p className="iv-label mb-3 text-purple-400">VIP Access. Strategic Partnership.</p>
                <h1 className="iv-title text-5xl sm:text-6xl">VIP Partner Access</h1>
                <p className="iv-body mt-5 max-w-3xl text-base text-zinc-300">
                  Reserved for qualified partners, serious contributors, and high-level members looking to participate beyond standard education.
                </p>
              </div>

              <div className="border border-[#242424] bg-[#080808] p-5">
                <p className="iv-label-muted mb-3">Partner Signal</p>
                <p className="font-mono text-sm uppercase tracking-[0.2em] text-zinc-200">
                  Strategic ecosystem access for qualified members.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {vipCards.map(({ title, description, icon: Icon }) => (
              <article key={title} className="iv-panel iv-panel-hover p-6">
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center border border-[#2a2a2a] bg-[#080808] text-purple-300">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </div>
                <h2 className="iv-card-title mb-3 text-3xl">{title}</h2>
                <p className="iv-body text-sm text-zinc-400">{description}</p>
              </article>
            ))}
          </div>

          <div className="iv-panel iv-panel-lime p-6 sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <p className="iv-body max-w-3xl text-sm text-zinc-300">
                Interested in VIP partnership access? Submit a request through the Status page or contact the Iron Vault team directly.
              </p>
              <a className="iv-button inline-flex items-center justify-center px-5 py-2.5 text-sm" href="/status">
                Submit Request
              </a>
            </div>
          </div>
        </section>
      </VIPGate>
    </section>
  )
}
