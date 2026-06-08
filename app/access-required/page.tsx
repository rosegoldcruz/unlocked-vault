import Link from 'next/link'

export default function AccessRequiredPage() {
  return (
    <main className="min-h-screen bg-[#080808] text-zinc-100 grid place-items-center px-6">
      <div className="iv-panel w-full max-w-2xl p-8 sm:p-10">
        <h1 className="iv-title text-5xl">Access Required</h1>
        <p className="iv-body mt-4">
          This portal is available only to approved Iron Vault members. Complete payment on the main Learn page or redeem an invite if one was issued to you.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/redeem-invite"
            className="iv-button-ghost inline-flex items-center justify-center px-5 py-2.5 text-xs"
          >
            Redeem Invite
          </Link>
          <Link
            href="https://ironvaulttoken.com/learn"
            className="iv-button inline-flex items-center justify-center px-5 py-2.5 text-sm"
          >
            Go to Learn Page
          </Link>
          <Link
            href="/"
            className="iv-button-ghost inline-flex items-center justify-center px-5 py-2.5 text-xs"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  )
}
