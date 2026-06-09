"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ComponentType, type ReactNode } from 'react'
import {
  LayoutDashboard,
  GraduationCap,
  Vault,
  Coins,
  Users,
  Star,
  LifeBuoy,
  UserCircle2,
  Shield,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { usePrivy } from '@privy-io/react-auth'
import { useBackofficeAuth } from '@/hooks/useBackofficeAuth'
import { cn } from '@/lib/utils'
import { CoinBurst } from '@/components/ui/coin-burst'
import { IronVaultBackground } from '@/components/ui/iron-vault-background'
import { DailyDefiNewsModal } from '@/components/backoffice/DailyDefiNewsModal'

type NavItem = {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/academy', label: 'Academy', icon: GraduationCap },
  { href: '/rewards', label: 'Rewards', icon: Coins },
  { href: '/vault', label: 'Vault', icon: Vault },
  { href: '/referrals', label: 'Referrals', icon: Users },
  { href: '/vip', label: 'VIP', icon: Star },
  { href: '/status', label: 'Status', icon: LifeBuoy },
  { href: '/account', label: 'Account', icon: UserCircle2 },
]

const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: '/admin/rewards', label: 'Admin Rewards', icon: Shield },
]

function NavLinks({ pathname, onNavigate, isAdmin }: { pathname: string; onNavigate?: () => void; isAdmin: boolean }) {
  const { logout } = usePrivy()
  const navItems = isAdmin ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS] : NAV_ITEMS
  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/')
        return (
          <CoinBurst key={item.href}>
            <Link
              href={item.href}
              prefetch
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded px-3 py-2.5 text-sm transition-all duration-150 border',
                isActive
                  ? 'iv-chip-lime shadow-[0_0_14px_rgba(170,255,0,0.12)]'
                  : 'border-[#1a1a1a] bg-[#0f0f0f] text-zinc-400 hover:border-[#7b2fbe]/60 hover:text-zinc-100',
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          </CoinBurst>
        )
      })}
      <CoinBurst>
        <button
          type="button"
          onClick={() => { onNavigate?.(); void logout() }}
          className="flex w-full items-center gap-3 rounded border border-[#1a1a1a] bg-[#0f0f0f] px-3 py-2.5 text-sm text-zinc-400 transition-all duration-150 hover:border-red-400/30 hover:text-red-300"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </CoinBurst>
    </nav>
  )
}

export function BackofficeLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { profile } = useBackofficeAuth()
  const isAdmin = profile?.role === 'ADMIN'

  return (
    <div className="iv-portal-shell relative isolate min-h-screen overflow-x-hidden bg-black text-zinc-100">
      <IronVaultBackground />

      {/* Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 border-r border-[#1a1a1a] bg-[#080808]/92 flex-col shadow-xl shadow-black/30">
        <div className="flex h-full w-full flex-col p-5">
          <div className="mb-8">
            <p className="iv-label">Iron Vault</p>
            <h1 className="iv-title mt-1 text-2xl">Member Portal</h1>
          </div>
          <NavLinks pathname={pathname} isAdmin={isAdmin} />
          <div className="iv-panel iv-panel-lime mt-auto p-3">
            <p className="iv-label-muted mb-1">Tier</p>
            <p className="text-sm text-zinc-100">{profile?.current_tier ?? 'MEMBER'}</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="relative z-10 lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-[#1a1a1a] bg-[#080808]/90">
          <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded border border-[#1e1e1e] text-zinc-200 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="hidden lg:block">
              <p className="font-mono text-xs text-zinc-500">{profile?.email ?? 'No email on file'}</p>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm">
              <span className="rounded border border-[#2a2a2a] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">{profile?.role ?? 'MEMBER'}</span>
              <span className="iv-chip-lime rounded px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em]">
                XP {profile?.vault_xp?.toLocaleString() ?? '0'}
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>

      <DailyDefiNewsModal memberId={profile?.email} />

      {/* Mobile nav overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/70" aria-label="Close navigation overlay" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-[#1a1a1a] bg-[#080808] p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="iv-label">Iron Vault</p>
                <p className="iv-title mt-1 text-2xl">Member Portal</p>
              </div>
              <button type="button" onClick={() => setMobileNavOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded border border-[#1e1e1e] text-zinc-200" aria-label="Close navigation">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="iv-panel mb-4 p-3 text-sm">
              <p className="text-zinc-100">{profile?.email ?? 'No email on file'}</p>
              <p className="mt-1 text-zinc-400">{profile?.role ?? 'MEMBER'} · {profile?.current_tier ?? 'MEMBER'}</p>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setMobileNavOpen(false)} isAdmin={isAdmin} />
          </div>
        </div>
      )}
    </div>
  )
}
