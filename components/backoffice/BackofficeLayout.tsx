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
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/')
        return (
          <CoinBurst key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150',
                isActive
                  ? 'bg-lime-400/15 text-lime-300 border border-lime-400/40 shadow-[0_0_14px_rgba(163,230,53,0.12)]'
                  : 'text-zinc-300 hover:bg-white/5 hover:text-zinc-100 border border-transparent hover:border-white/10',
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
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-red-300 border border-transparent hover:border-white/10 transition-all duration-150"
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
    <div className="min-h-screen text-zinc-100">
      <IronVaultBackground />

      {/* Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 border-r border-white/10 bg-black/50 backdrop-blur-xl flex-col shadow-xl shadow-black/30">
        <div className="flex h-full w-full flex-col p-5">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.24em] text-lime-300">Iron Vault</p>
            <h1 className="mt-1 text-base font-semibold text-zinc-100">Member Portal</h1>
          </div>
          <NavLinks pathname={pathname} isAdmin={isAdmin} />
          <div className="mt-auto rounded-lg border border-white/10 bg-black/30 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-1">Tier</p>
            <p className="text-sm text-zinc-100">{profile?.current_tier ?? 'MEMBER'}</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-700 text-zinc-200 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="hidden lg:block">
              <p className="text-sm text-zinc-200">{profile?.email ?? 'No email on file'}</p>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm">
              <span className="rounded-md border border-zinc-700 px-2.5 py-1 text-zinc-200">{profile?.role ?? 'MEMBER'}</span>
              <span className="rounded-md border border-lime-300/30 bg-lime-300/10 px-2.5 py-1 text-lime-200">
                XP {profile?.vault_xp?.toLocaleString() ?? '0'}
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      {/* Mobile nav overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/60" aria-label="Close navigation overlay" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-white/10 bg-black/80 backdrop-blur-xl p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-lime-300">Iron Vault</p>
                <p className="mt-1 text-base font-semibold">Member Portal</p>
              </div>
              <button type="button" onClick={() => setMobileNavOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-700 text-zinc-200" aria-label="Close navigation">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-4 rounded-lg border border-white/10 bg-black/30 p-3 text-sm">
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
