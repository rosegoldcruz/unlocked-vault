'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'

export default function RootEntryPage() {
  const router = useRouter()
  const { ready, authenticated, login } = usePrivy()

  useEffect(() => {
    if (ready && authenticated) {
      router.replace('/dashboard')
    }
  }, [authenticated, ready, router])

  if (!ready) {
    return (
      <main className="min-h-screen bg-[#080808] text-zinc-100 grid place-items-center px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-lime-300 mb-3">Iron Vault</p>
          <p className="text-sm text-zinc-400">Loading Iron Vault...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#080808] text-zinc-100 grid place-items-center px-6">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950/70 p-8 text-center">
        <p className="text-xs uppercase tracking-[0.24em] text-lime-300 mb-3">Iron Vault</p>
        <h1 className="text-2xl font-semibold mb-3">Member Portal</h1>
        <p className="text-sm text-zinc-400 mb-6">
          Sign in to continue. Access is limited to approved members.
        </p>
        <button
          type="button"
          onClick={() => login()}
          className="inline-flex items-center justify-center rounded-md bg-lime-300 px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-lime-200"
          disabled={!ready}
        >
          {ready ? 'Sign In' : 'Loading...'}
        </button>
        <p className="mt-6 text-xs text-zinc-500">
          If you do not yet have access, continue on the{' '}
          <Link className="text-lime-300 hover:text-lime-200" href="https://ironvaulttoken.com/learn">
            Learn page
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
