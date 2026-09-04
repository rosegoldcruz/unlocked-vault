import Link from 'next/link'
import { ACADEMY_ROUTES, arePaymentsEnabled } from '@/lib/academy-routes'

export default function LearnPayPage() {
  const paymentsEnabled = arePaymentsEnabled()

  return (
    <main className="min-h-screen bg-[#080808] text-zinc-100">
      <header className="border-b border-zinc-900/90 bg-[#080808]/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href={ACADEMY_ROUTES.learn} className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-lime-300 shadow-[0_0_18px_rgba(170,255,0,0.7)]" />
            <span className="iv-card-title text-2xl">IRON VAULT</span>
          </Link>
          <Link href={ACADEMY_ROUTES.memberLogin} className="iv-button-ghost px-4 py-2 text-xs">
            Member Login
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="iv-label mb-5">Academy Access</p>
        <h1 className="iv-title text-6xl sm:text-7xl">Full Academy Access</h1>
        <p className="iv-body mt-5 max-w-2xl text-lg">
          Modules 1-12, member resources, referral features, dashboard access, and account-specific tools unlock through the approved academy access path.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {['Full curriculum modules', 'Member dashboard tools', 'Referral and vault resources'].map((item) => (
            <div key={item} className="iv-panel p-5">
              <p className="iv-label-muted mb-3">Included</p>
              <h2 className="iv-card-title text-3xl">{item}</h2>
            </div>
          ))}
        </div>

        <div className="iv-panel iv-panel-lime mt-8 p-6">
          <p className="iv-label mb-3">{paymentsEnabled ? 'Checkout Available' : 'Payment Safe Mode'}</p>
          <h2 className="iv-card-title text-4xl">
            {paymentsEnabled ? 'Continue through the approved checkout path.' : 'Checkout is temporarily paused.'}
          </h2>
          <p className="iv-body mt-3 text-sm">
            {paymentsEnabled
              ? 'Use the approved payment path connected to Iron Vault member fulfillment.'
              : 'Online checkout is not launched from this page while payments are restricted. Use member login if you already have access, or redeem an invite if one was issued to you.'}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href={ACADEMY_ROUTES.memberLogin} className="iv-button inline-flex items-center justify-center px-6 py-3 text-sm">
              Member Login
            </Link>
            <Link href="/redeem-invite" className="iv-button-ghost inline-flex items-center justify-center px-6 py-3 text-xs">
              Redeem Invite
            </Link>
            <Link href={ACADEMY_ROUTES.module0} className="iv-button-ghost inline-flex items-center justify-center px-6 py-3 text-xs">
              Open Module 0
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
