'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'

type AccessCheckState = 'idle' | 'checking' | 'syncing'

type AccessMeResponse = {
  authenticated?: boolean
  entitled?: boolean
}

export default function RootEntryPage() {
  const router = useRouter()
  const { ready, authenticated, login, getAccessToken } = usePrivy()
  const [accessCheck, setAccessCheck] = useState<AccessCheckState>('idle')
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

    const verifyServerAccess = async () => {
      try {
        const token = await getAccessToken()
        if (!token) {
          if (!cancelled) setAccessCheck('syncing')
          return
        }

        const response = await fetch('/api/access/me', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })

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

        // 401 or unexpected response: the server hasn't recognized the
        // client session yet. Stay put rather than bouncing to /dashboard
        // (which would just redirect back here and loop).
        setAccessCheck('syncing')
      } catch {
        if (!cancelled) setAccessCheck('syncing')
      }
    }

    void verifyServerAccess()

    return () => {
      cancelled = true
    }
  }, [authenticated, ready, router, getAccessToken])

  if (!ready || accessCheck === 'checking') {
    return (
      <main className="min-h-screen bg-[#080808] text-zinc-100 grid place-items-center px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-lime-300 mb-3">Iron Vault</p>
          <p className="text-sm text-zinc-400">Loading Iron Vault...</p>
        </div>
      </main>
    )
  }

  if (accessCheck === 'syncing') {
    return (
      <main className="min-h-screen bg-[#080808] text-zinc-100 grid place-items-center px-6">
        <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950/70 p-8 text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-lime-300 mb-3">Iron Vault</p>
          <h1 className="text-2xl font-semibold mb-3">Syncing your session...</h1>
          <p className="text-sm text-zinc-400 mb-6">
            We could not confirm your access with the server yet. Refresh the page, or sign in again if this persists.
          </p>
          <button
            type="button"
            onClick={() => {
              checkedRef.current = false
              setAccessCheck('idle')
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
