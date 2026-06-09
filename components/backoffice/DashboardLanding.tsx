"use client"

import Link from 'next/link'
import { ArrowRight, GraduationCap, Vault, Users, LifeBuoy, Star } from 'lucide-react'
import { useBackofficeAuth } from '@/hooks/useBackofficeAuth'
import { DailyDefiNewsSection } from '@/components/backoffice/DailyDefiNewsModal'

const quickLinks = [
  { href: '/academy', title: 'Continue Academy', desc: 'Resume your Iron Vault curriculum and earn XP.', icon: GraduationCap, accent: 'lime' },
  { href: '/vault', title: 'Open Vault', desc: 'View your position matrix, investments, and referral stats.', icon: Vault, accent: 'purple' },
  { href: '/referrals', title: 'Refer a Friend', desc: 'Share your referral link and submit new leads.', icon: Users, accent: 'lime' },
  { href: '/status', title: 'Submit Status Request', desc: 'Open a support ticket with the Iron Vault team.', icon: LifeBuoy, accent: 'purple' },
  { href: '/vip', title: 'View VIP Access', desc: 'Check your VIP status and premium member benefits.', icon: Star, accent: 'lime' },
]

export function DashboardLanding() {
  const { profile } = useBackofficeAuth()

  return (
    <section className="space-y-8">
      {/* Welcome header */}
      <div className="iv-panel iv-panel-lime p-6">
        <p className="iv-label mb-2">Iron Vault Member Portal</p>
        <h1 className="iv-title mb-2 text-5xl">
          Welcome{profile?.email ? `, ${profile.email.split('@')[0]}` : ''}.
        </h1>
        <p className="iv-body max-w-2xl text-sm">
          This is your Iron Vault member command center. Navigate using the sidebar to access your Academy, Vault, Referrals, and more.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Email', value: profile?.email ?? 'No email on file' },
            { label: 'Role', value: profile?.role ?? 'MEMBER' },
            { label: 'Tier', value: profile?.current_tier ?? 'MEMBER' },
            { label: 'Vault XP', value: (profile?.vault_xp ?? 0).toLocaleString() },
          ].map((item) => (
            <div key={item.label} className="iv-panel p-4">
              <p className="iv-label-muted mb-2">{item.label}</p>
              <p className="font-mono text-sm text-zinc-100 break-all">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick action links */}
      <div>
        <h2 className="iv-label-muted mb-4">Quick Access</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((card) => {
            const Icon = card.icon
            const isLime = card.accent === 'lime'
            return (
              <Link
                key={card.href}
                href={card.href}
                className="iv-panel iv-panel-hover group p-5"
              >
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded border ${isLime ? 'iv-chip-lime' : 'iv-chip-purple'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="iv-card-title mb-2 text-2xl">{card.title}</h3>
                <p className="iv-body mb-4 text-sm">{card.desc}</p>
                <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-lime-300">
                  Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Daily DeFi news */}
      <div>
        <DailyDefiNewsSection />
      </div>
    </section>
  )
}
