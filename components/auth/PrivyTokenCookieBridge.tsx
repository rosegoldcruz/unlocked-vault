'use client'

import { useCallback, useEffect } from 'react'
import { usePrivy, useToken } from '@privy-io/react-auth'

// Must match an entry in PRIVY_ACCESS_TOKEN_COOKIE_NAMES (lib/server/privy-auth.ts)
const PRIVY_TOKEN_COOKIE_NAME = 'privy-token'
const COOKIE_MAX_AGE_SECONDS = 5 * 60

function isLocalDevEnvironment(): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  if (typeof window === 'undefined') return false
  const hostname = window.location.hostname
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
}

function cookieAttributes(maxAgeSeconds: number): string {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
  const attrs = [`path=/`, `max-age=${maxAgeSeconds}`, `samesite=lax`]
  if (isHttps) attrs.push('secure')
  return attrs.join('; ')
}

function writeTokenCookie(token: string) {
  document.cookie = `${PRIVY_TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; ${cookieAttributes(COOKIE_MAX_AGE_SECONDS)}`
}

function clearTokenCookie() {
  document.cookie = `${PRIVY_TOKEN_COOKIE_NAME}=; ${cookieAttributes(0)}`
}

// Local-dev only: localhost can't see the production HttpOnly Privy cookies (different origin), so mirror the client access token into a same-name cookie the server guard already reads. No-ops in production.
export function PrivyTokenCookieBridge() {
  const { ready, authenticated, getAccessToken } = usePrivy()
  const active = isLocalDevEnvironment()

  useToken({
    onAccessTokenGranted: useCallback(({ accessToken }: { accessToken: string }) => {
      if (isLocalDevEnvironment()) writeTokenCookie(accessToken)
    }, []),
    onAccessTokenRemoved: useCallback(() => {
      if (isLocalDevEnvironment()) clearTokenCookie()
    }, []),
  })

  useEffect(() => {
    if (!active) return
    if (!ready) return

    if (!authenticated) {
      clearTokenCookie()
      return
    }

    let cancelled = false

    getAccessToken()
      .then((token) => {
        if (cancelled) return
        if (token) writeTokenCookie(token)
        else clearTokenCookie()
      })
      .catch(() => {
        if (!cancelled) clearTokenCookie()
      })

    return () => {
      cancelled = true
    }
  }, [active, ready, authenticated, getAccessToken])

  return null
}
