'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { IronVaultLoader } from '@/components/ui/iron-vault-loader'

type AccessCheckState = 'idle' | 'checking' | 'failed'

type AccessMeResponse = {
  authenticated?: boolean
  entitled?: boolean
}

const MAX_SYNC_ATTEMPTS = 5
const RETRY_DELAYS_MS = [500, 1_000, 2_000, 4_000, 8_000] as const

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default function RootEntryPage() {
  const router = useRouter()
  const { ready, authenticated, login, getAccessToken } = usePrivy()
  const [accessCheck, setAccessCheck] = useState<AccessCheckState>('idle')
  const [failureReason, setFailureReason] = useState<string | null>(null)
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
    setFailureReason(null)

    const syncAndVerifyServerAccess = async () => {
      try {
        let token: string | null = null
        for (let attempt = 0; attempt < MAX_SYNC_ATTEMPTS; attempt += 1) {
          token = await getAccessToken()
          if (cancelled || token) break
          await delay(RETRY_DELAYS_MS[attempt] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1])
        }

        if (!token) {
          if (!cancelled) {
            setFailureReason('empty_access_token')
            setAccessCheck('failed')
          }
          return
        }

        const sessionResponse = await fetch('/api/auth/privy-session', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
          cache: 'no-store',
        })

        if (cancelled) return

        if (!sessionResponse.ok) {
          const data = (await sessionResponse.json().catch(() => null)) as { reason?: string } | null
          setFailureReason(data?.reason ?? 'session_sync_failed')
          setAccessCheck('failed')
          return
        }

        const response = await fetch('/api/access/me', { credentials: 'include', cache: 'no-store' })

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

        setFailureReason(response.status === 401 ? 'access_check_unauthorized' : 'access_check_failed')
        setAccessCheck('failed')
      } catch {
        if (!cancelled) {
          setFailureReason('session_sync_error')
          setAccessCheck('failed')
        }
      }
    }

    void syncAndVerifyServerAccess()

    return () => {
      cancelled = true
    }
  }, [authenticated, ready, router, getAccessToken, retryNonce])

  if (!ready || (authenticated && accessCheck !== 'failed')) {
    return <IronVaultLoader label={!ready ? 'Portal activating' : 'Session syncing'} />
  }

  if (authenticated && accessCheck === 'failed') {
    return (
      <main className="min-h-screen bg-[#080808] text-zinc-100 grid place-items-center px-6">
        <div className="iv-panel w-full max-w-md p-8 text-center">
          <p className="iv-label mb-3">Iron Vault</p>
          <h1 className="iv-title mb-3 text-4xl">Session sync failed</h1>
          <p className="iv-body mb-6 text-sm">
            We could not confirm your access with the server yet. Retry to sync your session again.
          </p>
          {failureReason ? (
            <p className="mb-6 text-xs text-zinc-500">Diagnostic: {failureReason}</p>
          ) : null}
          <button
            type="button"
            onClick={() => {
              checkedRef.current = false
              setFailureReason(null)
              setAccessCheck('checking')
              setRetryNonce((value) => value + 1)
            }}
            className="iv-button inline-flex items-center justify-center px-5 py-2.5 text-sm"
          >
            Retry
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#080808] text-zinc-100 grid place-items-center px-6">
      <div className="iv-panel w-full max-w-md p-8 text-center">
        <p className="iv-label mb-3">Iron Vault</p>
        <h1 className="iv-title mb-3 text-4xl">Member Portal</h1>
        <p className="iv-body mb-6 text-sm">
          Sign in to continue. Access is limited to approved members.
        </p>
        <button
          type="button"
          onClick={() => login()}
          className="iv-button inline-flex items-center justify-center px-5 py-2.5 text-sm"
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
