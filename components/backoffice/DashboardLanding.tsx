"use client"

import Link from 'next/link'
import { ArrowRight, GraduationCap, Vault, Users, LifeBuoy, Star } from 'lucide-react'
import { useBackofficeAuth } from '@/hooks/useBackofficeAuth'

const quickLinks = [
  { href: '/academy', title: 'Continue Academy', desc: 'Resume your Iron Vault curriculum and earn XP.', icon: GraduationCap, accent: 'lime' },
  { href: '/vault', title: 'Open Vault', desc: 'View your position matrix, investments, and referral stats.', icon: Vault, accent: 'purple' },
  { href: '/referrals', title: 'Refer a Friend', desc: 'Share your referral link and submit new leads.', icon: Users, accent: 'lime' },
  { href: '/status', title: 'Submit Status Request', desc: 'Open a support ticket with the Iron Vault team.', icon: LifeBuoy, accent: 'purple' },
  { href: '/vip', title: 'View VIP Access', desc: 'Check your VIP status and premium member benefits.', icon: Star, accent: 'lime' },
]

const updates = [
  { title: 'Iron Vault Academy Live', body: 'All 6 modules are now available. Complete them in order to unlock your full token allocation.' },
  { title: 'Referral Program Active', body: 'Submit leads through your backoffice. Commission tracking is coming soon.' },
  { title: 'Vault Backoffice Launch', body: 'Your full member backoffice is now live. Track positions, referrals, and status from one place.' },
]

export function DashboardLanding() {
  const { profile } = useBackofficeAuth()

  return (
    <section className="space-y-8">
      {/* Welcome header */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-lime-300 mb-2">Iron Vault Member Portal</p>
        <h1 className="text-3xl font-semibold text-zinc-100 mb-2">
          Welcome{profile?.email ? `, ${profile.email.split('@')[0]}` : ''}.
        </h1>
        <p className="text-zinc-400 max-w-2xl">
          This is your Iron Vault member command center. Navigate using the sidebar to access your Academy, Vault, Referrals, and more.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Email', value: profile?.email ?? 'No email on file' },
            { label: 'Role', value: profile?.role ?? 'MEMBER' },
            { label: 'Tier', value: profile?.current_tier ?? 'MEMBER' },
            { label: 'Vault XP', value: (profile?.vault_xp ?? 0).toLocaleString() },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">{item.label}</p>
              <p className="text-sm text-zinc-100 break-all">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick action links */}
      <div>
        <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500 mb-4">Quick Access</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((card) => {
            const Icon = card.icon
            const isLime = card.accent === 'lime'
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group rounded-2xl border border-zinc-800 bg-zinc-950/50 p-5 transition hover:border-lime-300/30 hover:bg-zinc-900/70"
              >
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border ${isLime ? 'border-lime-300/30 text-lime-300' : 'border-purple-500/30 text-purple-400'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-zinc-100 mb-2">{card.title}</h3>
                <p className="text-sm text-zinc-400 mb-4">{card.desc}</p>
                <span className="inline-flex items-center gap-2 text-sm text-lime-200">
                  Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Iron Vault updates */}
      <div>
        <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500 mb-4">Iron Vault Updates</h2>
        <div className="space-y-3">
          {updates.map((update) => (
            <div key={update.title} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-lime-400" />
                <div>
                  <p className="text-sm font-semibold text-zinc-100 mb-1">{update.title}</p>
                  <p className="text-sm text-zinc-400">{update.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
