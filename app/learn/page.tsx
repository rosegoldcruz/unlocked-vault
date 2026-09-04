import Link from 'next/link'
import { ACADEMY_ROUTES } from '@/lib/academy-routes'

const lockedModules = [
  'Money System Orientation',
  'Debt, Credit, and Leverage',
  'Asset Ownership',
  'Crypto and Token Utility',
  'Real Estate and RWA',
  'Business Cash Flow',
  'Tax Structure Basics',
  'DeFi and Stablecoins',
  'Private Market Access',
  'Referral Engine',
  'Member Dashboard Tools',
  'Vault Strategy Review',
]

export default function LearnPage() {
  return (
    <main className="min-h-screen bg-[#080808] text-zinc-100">
      <header className="border-b border-zinc-900/90 bg-[#080808]/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href={ACADEMY_ROUTES.learn} className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-lime-300 shadow-[0_0_18px_rgba(170,255,0,0.7)]" />
            <span className="iv-card-title text-2xl">IRON VAULT</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href={ACADEMY_ROUTES.memberLogin} className="iv-button-ghost px-4 py-2 text-xs">
              Member Login
            </Link>
            <Link href={ACADEMY_ROUTES.pricing} className="iv-button px-4 py-2 text-xs">
              Unlock Full Academy
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div>
          <p className="iv-label mb-5">IVT Media Group Academy</p>
          <h1 className="iv-title max-w-3xl text-6xl sm:text-7xl lg:text-8xl">
            Learn Before You Pay
          </h1>
          <p className="iv-body mt-6 max-w-2xl text-lg">
            Start with Module 0 for free. Understand the academy structure, the member path, and what unlocks before choosing a paid access route.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={ACADEMY_ROUTES.module0} className="iv-button inline-flex items-center justify-center px-6 py-3 text-sm">
              Start Module 0
            </Link>
            <Link href={ACADEMY_ROUTES.pricing} className="iv-button-ghost inline-flex items-center justify-center px-6 py-3 text-xs">
              Unlock Full Academy
            </Link>
          </div>
        </div>

        <aside className="iv-panel iv-panel-lime p-6">
          <p className="iv-label mb-4">Academy Entry</p>
          <div className="space-y-4">
            <div className="rounded border border-lime-300/30 bg-lime-300/10 p-4">
              <p className="iv-label mb-2">Free</p>
              <h2 className="iv-card-title text-4xl">Module 0</h2>
              <p className="iv-body mt-2 text-sm">
                Orientation Before Access. No checkout, code, or login required.
              </p>
              <Link href={ACADEMY_ROUTES.module0} className="iv-button mt-4 inline-flex px-5 py-2.5 text-xs">
                Start Learning Now
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="iv-panel p-3">
                <p className="iv-label-muted">Free</p>
                <p className="iv-card-title text-3xl text-lime-300">1</p>
              </div>
              <div className="iv-panel p-3">
                <p className="iv-label-muted">Locked</p>
                <p className="iv-card-title text-3xl">12</p>
              </div>
              <div className="iv-panel p-3">
                <p className="iv-label-muted">Access</p>
                <p className="iv-card-title text-3xl">Safe</p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="border-t border-zinc-900 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="iv-label mb-3">Curriculum Preview</p>
              <h2 className="iv-title text-5xl">Module 0 free. Modules 1-12 locked.</h2>
            </div>
            <Link href={ACADEMY_ROUTES.pricing} className="iv-button-ghost inline-flex items-center justify-center px-5 py-2.5 text-xs">
              View Pricing
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Link href={ACADEMY_ROUTES.module0} className="iv-panel iv-panel-lime iv-panel-hover block p-5">
              <p className="iv-label mb-3">Module 0</p>
              <h3 className="iv-card-title text-3xl">Orientation Before Access</h3>
              <p className="iv-body mt-2 text-sm">Public entry module. Start here before choosing a paid path.</p>
            </Link>

            {lockedModules.map((title, index) => (
              <div key={title} className="iv-panel p-5 opacity-70">
                <p className="iv-label-muted mb-3">Module {index + 1}</p>
                <h3 className="iv-card-title text-3xl">{title}</h3>
                <p className="iv-body mt-2 text-sm">Locked preview. Full academy access required.</p>
                <Link href={ACADEMY_ROUTES.pricing} className="iv-button-ghost mt-4 inline-flex px-4 py-2 text-xs">
                  View Access
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-900 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 text-xs text-zinc-500 sm:flex-row">
          <span>IVT Media Group</span>
          <div className="flex gap-4">
            <Link href={ACADEMY_ROUTES.module0} className="hover:text-lime-300">Open Module 0</Link>
            <Link href={ACADEMY_ROUTES.pricing} className="hover:text-lime-300">Full Academy Access</Link>
            <Link href={ACADEMY_ROUTES.memberLogin} className="hover:text-lime-300">Member Login</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
