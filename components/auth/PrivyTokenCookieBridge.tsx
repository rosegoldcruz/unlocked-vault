'use client'

import { useEffect, useRef } from 'react'
import { usePrivy } from '@privy-io/react-auth'

const RETRY_COOLDOWN_MS = 10_000

function tokenFingerprint(token: string): string {
  return `${token.length}:${token.slice(0, 12)}:${token.slice(-12)}`
}

export function PrivyTokenCookieBridge() {
  const { ready, authenticated, getAccessToken } = usePrivy()
  const lastSyncedTokenRef = useRef<string | null>(null)
  const lastFailureAtRef = useRef(0)

  useEffect(() => {
    if (!ready) return

    if (!authenticated) {
      lastSyncedTokenRef.current = null
      void fetch('/api/auth/privy-session', { method: 'DELETE' })
      return
    }

    let cancelled = false

    const syncSession = async () => {
      const now = Date.now()
      if (now - lastFailureAtRef.current < RETRY_COOLDOWN_MS) return

      try {
        const token = await getAccessToken()
        if (cancelled) return
        if (!token) return

        const fingerprint = tokenFingerprint(token)
        if (lastSyncedTokenRef.current === fingerprint) return

        const response = await fetch('/api/auth/privy-session', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })

        if (cancelled) return

        if (response.ok) {
          lastSyncedTokenRef.current = fingerprint
          window.dispatchEvent(new Event('privy-server-session-ready'))
          return
        }

        lastFailureAtRef.current = Date.now()
      } catch {
        if (!cancelled) lastFailureAtRef.current = Date.now()
      }
    }

    void syncSession()

    return () => {
      cancelled = true
    }
  }, [ready, authenticated, getAccessToken])

  return null
}
