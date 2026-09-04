import Link from 'next/link'
import { ACADEMY_ROUTES } from '@/lib/academy-routes'

const sections = [
  {
    title: 'Why the academy starts here',
    body: 'Iron Vault begins with education first. Module 0 is open so every visitor can understand the academy structure, the member path, and the difference between public learning and full access.',
  },
  {
    title: 'What is free',
    body: 'The free module does not require checkout. It does not require a member login. It exists to orient users before they choose whether to continue.',
  },
  {
    title: 'What unlocks later',
    body: 'Full academy access may unlock additional modules, member resources, referral features, dashboard access, and account-specific tools depending on the selected path.',
  },
  {
    title: 'Before you continue',
    body: 'Review the public orientation, then choose whether to view the full academy access path or return to the public learn page.',
  },
]

export default function ModuleZeroPage() {
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
        <p className="iv-label mb-5">Free Academy Orientation</p>
        <h1 className="iv-title text-6xl sm:text-7xl">Module 0 - Orientation Before Access</h1>
        <p className="iv-body mt-5 max-w-2xl text-lg">
          Start here before choosing a paid academy path.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <section key={section.title} className="iv-panel iv-panel-lime p-6">
              <h2 className="iv-card-title text-4xl">{section.title}</h2>
              <p className="iv-body mt-3 text-sm">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="iv-panel mt-8 p-6">
          <p className="iv-label mb-3">No Payment Triggered</p>
          <p className="iv-body text-sm">
            No online checkout starts from this page. Choosing full academy access is a separate step.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href={ACADEMY_ROUTES.pricing} className="iv-button inline-flex items-center justify-center px-6 py-3 text-sm">
              View Full Academy Access
            </Link>
            <Link href={ACADEMY_ROUTES.learn} className="iv-button-ghost inline-flex items-center justify-center px-6 py-3 text-xs">
              Back to Learn
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
