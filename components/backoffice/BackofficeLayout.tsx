"use client"

import Link from 'next/link'
import { SignOutButton } from '@clerk/nextjs'
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
import { useBackofficeAuth } from '@/hooks/useBackofficeAuth'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'

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
  const navItems = isAdmin ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS] : NAV_ITEMS
  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            onClick={onNavigate}
            className={cn('iv-member-nav-link', isActive && 'is-active')}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        )
      })}
      <SignOutButton>
        <button
          type="button"
          onClick={() => onNavigate?.()}
          className="iv-member-nav-link w-full hover:text-red-300"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </SignOutButton>
    </nav>
  )
}

export function BackofficeLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { profile } = useBackofficeAuth()
  const isAdmin = profile?.role === 'ADMIN'

  return (
    <div className="iv-member-shell iv-portal-shell">
      <div className="iv-member-ambient" aria-hidden>
        <div className="iv-member-ambient-glow" />
        <div className="iv-member-dot-pattern" />
        <div className="iv-member-flickering-grid" />
      </div>

      {/* Sidebar */}
      <aside className="iv-member-sidebar hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 flex-col">
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
        <header className="iv-member-header sticky top-0 z-30">
          <div className="mx-auto flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="iv-member-icon-button lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="hidden min-w-0 lg:block">
              <p className="truncate font-mono text-xs text-[var(--iv-ink-3)]">{profile?.email ?? 'No email on file'}</p>
            </div>
            <div className="flex min-w-0 items-center gap-2 text-xs sm:gap-3 sm:text-sm">
              <ThemeToggle />
              <span className="iv-member-chip">{profile?.role ?? 'MEMBER'}</span>
              <span className="iv-chip-lime rounded-full px-2.5 py-1 font-mono text-[10px] uppercase">
                XP {profile?.vault_xp?.toLocaleString() ?? '0'}
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>

      {/* Mobile nav overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/60" aria-label="Close navigation overlay" onClick={() => setMobileNavOpen(false)} />
          <div className="iv-member-mobile-menu absolute inset-y-0 left-0 w-72 max-w-[85vw] p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="iv-label">Iron Vault</p>
                <p className="iv-title mt-1 text-2xl">Member Portal</p>
              </div>
              <button type="button" onClick={() => setMobileNavOpen(false)} className="iv-member-icon-button" aria-label="Close navigation">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-4">
              <ThemeToggle />
            </div>
            <div className="iv-panel mb-4 p-3 text-sm">
              <p className="break-all text-[var(--iv-ink)]">{profile?.email ?? 'No email on file'}</p>
              <p className="mt-1 text-[var(--iv-ink-3)]">{profile?.role ?? 'MEMBER'} · {profile?.current_tier ?? 'MEMBER'}</p>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setMobileNavOpen(false)} isAdmin={isAdmin} />
          </div>
        </div>
      )}
    </div>
  )
}
