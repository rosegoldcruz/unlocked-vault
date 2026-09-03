'use client'

import { useEffect, useRef } from 'react'
import { usePrivy } from '@privy-io/react-auth'

const MAX_SYNC_ATTEMPTS = 5
const RETRY_DELAYS_MS = [500, 1_000, 2_000, 4_000, 8_000] as const

function tokenFingerprint(token: string): string {
  let hash = 0
  for (let index = 0; index < token.length; index += 1) {
    hash = (hash * 31 + token.charCodeAt(index)) | 0
  }
  return `${token.length}:${hash.toString(16)}`
}

export function PrivyTokenCookieBridge() {
  const { ready, authenticated, getAccessToken } = usePrivy()
  const lastSyncedTokenRef = useRef<string | null>(null)
  const inFlightRef = useRef(false)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!ready) return

    if (!authenticated) {
      lastSyncedTokenRef.current = null
      inFlightRef.current = false
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
      void fetch('/api/auth/privy-session', { method: 'DELETE', credentials: 'include' })
      return
    }

    let cancelled = false

    const scheduleRetry = (attempt: number) => {
      if (cancelled || attempt >= MAX_SYNC_ATTEMPTS - 1) return
      retryTimerRef.current = setTimeout(() => {
        void syncSession(attempt + 1)
      }, RETRY_DELAYS_MS[attempt] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1])
    }

    const syncSession = async (attempt: number) => {
      if (inFlightRef.current) return
      inFlightRef.current = true
      try {
        const token = await getAccessToken()
        if (cancelled) return

        if (!token) {
          console.info('[privy-bridge]', {
            ready,
            authenticated,
            hasGetAccessToken: typeof getAccessToken === 'function',
            hasToken: false,
            tokenLength: 0,
            sessionStatus: 'retrying',
            sessionReason: 'empty_access_token',
          })
          scheduleRetry(attempt)
          return
        }

        const fingerprint = tokenFingerprint(token)
        if (lastSyncedTokenRef.current === fingerprint) return

        const response = await fetch('/api/auth/privy-session', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
          cache: 'no-store',
        })

        if (cancelled) return

        if (response.ok) {
          lastSyncedTokenRef.current = fingerprint
          console.info('[privy-bridge]', {
            ready,
            authenticated,
            hasGetAccessToken: typeof getAccessToken === 'function',
            hasToken: true,
            tokenLength: token.length,
            sessionStatus: 'synced',
            sessionReason: 'ok',
          })
          window.dispatchEvent(new CustomEvent('privy-server-session-ready'))
          return
        }

        const data = (await response.json().catch(() => null)) as { reason?: string } | null
        const reason = data?.reason ?? 'session_sync_failed'
        console.info('[privy-bridge]', {
          ready,
          authenticated,
          hasGetAccessToken: typeof getAccessToken === 'function',
          hasToken: true,
          tokenLength: token.length,
          sessionStatus: response.status,
          sessionReason: reason,
        })
        window.dispatchEvent(new CustomEvent('privy-server-session-failed', { detail: { reason } }))
        scheduleRetry(attempt)
      } catch {
        if (!cancelled) {
          window.dispatchEvent(new CustomEvent('privy-server-session-failed', { detail: { reason: 'session_sync_error' } }))
          scheduleRetry(attempt)
        }
      } finally {
        inFlightRef.current = false
      }
    }

    void syncSession(0)

    return () => {
      cancelled = true
      inFlightRef.current = false
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
  }, [ready, authenticated, getAccessToken])

  return null
}
