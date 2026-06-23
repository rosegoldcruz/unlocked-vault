"use client"

import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import IronVaultAcademyUnlocked from '@/iron-vault-academy-unlocked'

export default function AcademyPage() {
  const { ready, authenticated, getAccessToken } = usePrivy()
  const [scope, setScope] = useState<{ allowedModules: number[]; accessType: 'free' | 'single_module' | 'all_modules' | 'admin' } | null>(null)
  const [scopeLoaded, setScopeLoaded] = useState(false)

  useEffect(() => {
    if (!ready) return
    if (!authenticated) {
      setScope({ allowedModules: [], accessType: 'free' })
      setScopeLoaded(true)
      return
    }

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
      <div className="grid place-items-center bg-[#080808]" style={{ minHeight: '100vh' }}>
        <p className="font-mono text-xs text-zinc-500 tracking-widest animate-pulse">LOADING ACADEMY ACCESS...</p>
      </div>
    )
  }

  return (
    <IronVaultAcademyUnlocked
      allowedModules={scope?.allowedModules ?? []}
      accessType={scope?.accessType ?? 'free'}
    />
  )
}