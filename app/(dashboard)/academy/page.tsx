"use client"

import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import IronVaultAcademyUnlocked from '@/iron-vault-academy-unlocked'
import { useBackofficeAuth } from '@/hooks/useBackofficeAuth'

export default function AcademyPage() {
  const { ready, authenticated, getAccessToken } = usePrivy()
  const { refreshProfile } = useBackofficeAuth()
  const [scope, setScope] = useState<{ allowedModules: number[]; accessType: string } | null>(null)
  const [scopeLoaded, setScopeLoaded] = useState(false)

  useEffect(() => {
    if (!ready || !authenticated) return
    let cancelled = false
    getAccessToken()
      .then((token) => token
        ? fetch('/api/access/me', { headers: { Authorization: `Bearer ${token}` } })
        : null)
      .then((response) => response?.json())
      .then((payload) => {
        if (cancelled) return
        if (payload?.scope?.allowedModules) {
          setScope({
            allowedModules: payload.scope.allowedModules,
            accessType: payload.scope.accessType,
          })
        }
        setScopeLoaded(true)
      })
      .catch(() => { if (!cancelled) setScopeLoaded(true) })

    return () => { cancelled = true }
  }, [authenticated, getAccessToken, ready])

  if (!scopeLoaded) {
    return (
      <div className="-mx-4 -my-6 sm:-mx-6 lg:-mx-8 grid place-items-center" style={{ minHeight: '60vh' }}>
        <p className="font-mono text-xs text-zinc-500 tracking-widest animate-pulse">LOADING MEMBER ACCESS...</p>
      </div>
    )
  }

  return (
    <div className="-mx-4 -my-6 sm:-mx-6 lg:-mx-8">
      <IronVaultAcademyUnlocked
        allowedModules={scope?.allowedModules ?? [1, 2, 3, 4, 5, 6]}
        accessType={scope?.accessType ?? 'all_modules'}
        onModuleComplete={() => { void refreshProfile() }}
      />
    </div>
  )
}
