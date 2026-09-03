"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { BackofficeLayout } from '@/components/backoffice/BackofficeLayout'
import { BackofficeProvider } from '@/components/backoffice/BackofficeProvider'
import IronVaultAcademyUnlocked from '@/iron-vault-academy-unlocked'

export default function AcademyPage() {
  const { isLoaded, isSignedIn } = useAuth()
  const [scope, setScope] = useState<{ allowedModules: number[]; accessType: 'free' | 'single_module' | 'all_modules' | 'admin' } | null>(null)
  const [scopeLoaded, setScopeLoaded] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      setScope({ allowedModules: [], accessType: 'free' })
      setScopeLoaded(true)
      return
    }

    let cancelled = false
    fetch('/api/access/me', { credentials: 'same-origin', cache: 'no-store' })
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
  }, [isLoaded, isSignedIn])

  if (!scopeLoaded) {
    return (
      <div className="grid place-items-center bg-[#080808]" style={{ minHeight: '100vh' }}>
        <p className="font-mono text-xs text-zinc-500 tracking-widest animate-pulse">LOADING ACADEMY ACCESS...</p>
      </div>
    )
  }

  const academy = (
    <IronVaultAcademyUnlocked
      allowedModules={scope?.allowedModules ?? []}
      accessType={scope?.accessType ?? 'free'}
    />
  )

  if (isSignedIn) {
    return (
      <BackofficeProvider>
        <BackofficeLayout>{academy}</BackofficeLayout>
      </BackofficeProvider>
    )
  }

  return academy
}
