import Link from 'next/link'

export default function AccessRequiredPage() {
  return (
    <main className="min-h-screen bg-[#080808] text-zinc-100 grid place-items-center px-6">
      <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-950/70 p-8 sm:p-10">
        <h1 className="text-3xl font-semibold text-zinc-100">Access Required</h1>
        <p className="mt-4 text-zinc-300 leading-relaxed">
          This portal is available only to approved Iron Vault members. Complete payment on the main Learn page or redeem an invite if one was issued to you.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="https://ironvaulttoken.com/learn"
            className="inline-flex items-center justify-center rounded-md bg-lime-300 px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-lime-200"
          >
            Go to Learn Page
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-100 hover:bg-zinc-900"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  )
}
