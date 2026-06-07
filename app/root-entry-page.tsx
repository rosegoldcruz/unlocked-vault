'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'

type AccessCheckState = 'idle' | 'checking' | 'failed'

type AccessMeResponse = {
  authenticated?: boolean
  entitled?: boolean
}

export default function RootEntryPage() {
  const router = useRouter()
  const { ready, authenticated, login, getAccessToken } = usePrivy()
  const [accessCheck, setAccessCheck] = useState<AccessCheckState>('idle')
  const [retryNonce, setRetryNonce] = useState(0)
  const checkedRef = useRef(false)

  useEffect(() => {
    if (!ready || !authenticated) {
      checkedRef.current = false
      setAccessCheck('idle')
      return
    }

    if (checkedRef.current) return
    checkedRef.current = true

    let cancelled = false
    setAccessCheck('checking')

    const syncAndVerifyServerAccess = async () => {
      try {
        const token = await getAccessToken()
        if (!token) {
          if (!cancelled) setAccessCheck('failed')
          return
        }

        const sessionResponse = await fetch('/api/auth/privy-session', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })

        if (cancelled) return

        if (!sessionResponse.ok) {
          setAccessCheck('failed')
          return
        }

        const response = await fetch('/api/access/me', { cache: 'no-store' })

        if (cancelled) return

        if (response.ok) {
          const data = (await response.json()) as AccessMeResponse
          if (data.authenticated && data.entitled) {
            router.replace('/dashboard')
            return
          }
        }

        if (response.status === 403) {
          router.replace('/access-required')
          return
        }

        setAccessCheck('failed')
      } catch {
        if (!cancelled) setAccessCheck('failed')
      }
    }

    void syncAndVerifyServerAccess()

    return () => {
      cancelled = true
    }
  }, [authenticated, ready, router, getAccessToken, retryNonce])

  if (!ready || (authenticated && accessCheck !== 'failed')) {
    return (
      <main className="min-h-screen bg-[#080808] text-zinc-100 grid place-items-center px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-lime-300 mb-3">Iron Vault</p>
          <p className="text-sm text-zinc-400">
            {!ready ? 'Loading Iron Vault...' : 'Syncing your session...'}
          </p>
        </div>
      </main>
    )
  }

  if (authenticated && accessCheck === 'failed') {
    return (
      <main className="min-h-screen bg-[#080808] text-zinc-100 grid place-items-center px-6">
        <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950/70 p-8 text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-lime-300 mb-3">Iron Vault</p>
          <h1 className="text-2xl font-semibold mb-3">Session sync failed</h1>
          <p className="text-sm text-zinc-400 mb-6">
            We could not confirm your access with the server yet. Retry to sync your session again.
          </p>
          <button
            type="button"
            onClick={() => {
              checkedRef.current = false
              setAccessCheck('checking')
              setRetryNonce((value) => value + 1)
            }}
            className="inline-flex items-center justify-center rounded-md bg-lime-300 px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-lime-200"
          >
            Retry
          </button>
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
