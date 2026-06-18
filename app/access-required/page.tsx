'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'

export default function AccessRequiredPage() {
  const router = useRouter()
  const { logout } = usePrivy()
  const [resetting, setResetting] = useState(false)

  async function handleLoginReset() {
    if (resetting) return

    setResetting(true)

    try {
      await fetch('/api/auth/privy-session', {
        method: 'DELETE',
        credentials: 'include',
        cache: 'no-store',
      }).catch(() => null)

      if (typeof logout === 'function') {
        await logout()
      }
    } catch {
      await fetch('/api/auth/privy-session', {
        method: 'DELETE',
        credentials: 'include',
        cache: 'no-store',
      }).catch(() => null)
    } finally {
      router.replace('/')
      router.refresh()
    }
  }

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
          <button
            type="button"
            onClick={handleLoginReset}
            disabled={resetting}
            className="iv-button-ghost inline-flex items-center justify-center px-5 py-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resetting ? 'Signing Out...' : 'Back to Login'}
          </button>
        </div>
      </div>
    </main>
  )
}
