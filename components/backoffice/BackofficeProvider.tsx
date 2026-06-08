"use client"

import { usePrivy } from '@privy-io/react-auth'
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchBackofficeJson, type BackofficeProfileResponse } from '@/lib/backoffice-client'
import type { BackofficeProfile } from '@/types/backoffice'

type BackofficeContextValue = {
  profile: BackofficeProfile | null
  loading: boolean
  error: string | null
  refreshProfile: () => Promise<void>
  isVip: boolean
  isAdmin: boolean
}

export const BackofficeContext = createContext<BackofficeContextValue | null>(null)

export function BackofficeProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, login, getAccessToken } = usePrivy()
  const [profile, setProfile] = useState<BackofficeProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshProfile = useCallback(async () => {
    if (!ready) return
    if (!authenticated) { setProfile(null); setError(null); setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Unauthorized: unable to retrieve access token')
      const payload = await fetchBackofficeJson<BackofficeProfileResponse>('/api/backoffice/profile', token)
      setProfile(payload.profile); setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load backoffice profile')
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [authenticated, getAccessToken, ready])

  useEffect(() => { void refreshProfile() }, [refreshProfile])

  const value = useMemo<BackofficeContextValue>(() => {
    const role = profile?.role ?? 'MEMBER'
    return { profile, loading, error, refreshProfile, isVip: role === 'VIP' || role === 'ADMIN', isAdmin: role === 'ADMIN' }
  }, [error, loading, profile, refreshProfile])

  if (!ready) return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 grid place-items-center px-6">
      <p className="text-sm tracking-wide text-zinc-300">Loading secure backoffice...</p>
    </div>
  )

  if (!authenticated) return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 grid place-items-center px-6">
      <div className="iv-panel w-full max-w-md p-8 text-center">
        <p className="iv-label mb-3">Iron Vault</p>
        <h1 className="iv-title mb-3 text-4xl">Sign in to continue</h1>
        <p className="iv-body mb-6 text-sm">Member backoffice access requires your authenticated Iron Vault account.</p>
        <button type="button" onClick={() => login()} className="iv-button inline-flex items-center justify-center px-5 py-2.5 text-sm">
          Sign In
        </button>
      </div>
    </div>
  )

  if (loading && !profile) return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 grid place-items-center px-6">
      <p className="text-sm tracking-wide text-zinc-300">Loading backoffice profile...</p>
    </div>
  )

  if (error && !profile) return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 grid place-items-center px-6">
      <div className="iv-panel w-full max-w-md p-8 text-center">
        <h1 className="iv-card-title mb-2 text-3xl">Unable to load backoffice</h1>
        <p className="text-sm text-zinc-400 mb-6">{error}</p>
        <button type="button" onClick={() => void refreshProfile()} className="iv-button inline-flex items-center justify-center px-5 py-2.5 text-sm">Retry</button>
      </div>
    </div>
  )

  return <BackofficeContext.Provider value={value}>{children}</BackofficeContext.Provider>
}
