'use client'

import { SignInButton, useAuth } from '@clerk/nextjs'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type AccessCheckState = 'idle' | 'checking' | 'failed'

type AccessMeResponse = {
  authenticated?: boolean
  entitled?: boolean
}

export default function RootEntryPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const [accessCheck, setAccessCheck] = useState<AccessCheckState>('idle')
  const [failureReason, setFailureReason] = useState<string | null>(null)
  const [retryNonce, setRetryNonce] = useState(0)
  const checkedRef = useRef(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      checkedRef.current = false
      setAccessCheck('idle')
      return
    }

    if (checkedRef.current) return
    checkedRef.current = true

    let cancelled = false
    setAccessCheck('checking')
    setFailureReason(null)

    const verifyServerAccess = async () => {
      try {
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
          setFailureReason('access_check_error')
          setAccessCheck('failed')
        }
      }
    }

    void verifyServerAccess()

    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, router, retryNonce])

  if (!isLoaded || (isSignedIn && accessCheck !== 'failed')) {
    return null
  }

  if (isSignedIn && accessCheck === 'failed') {
    return (
      <main className="min-h-screen bg-[#080808] text-zinc-100 grid place-items-center px-6">
        <div className="iv-panel w-full max-w-md p-8 text-center">
          <p className="iv-label mb-3">Iron Vault</p>
          <h1 className="iv-title mb-3 text-4xl">Access check failed</h1>
          <p className="iv-body mb-6 text-sm">
            We could not confirm your access with the server yet. Retry to check your session again.
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
        <SignInButton mode="modal">
          <button type="button" className="iv-button inline-flex items-center justify-center px-5 py-2.5 text-sm">
            Sign In
          </button>
        </SignInButton>
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
