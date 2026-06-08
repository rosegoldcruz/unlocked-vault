"use client"

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'

const IronVaultAcademyUnlocked = dynamic(
  () => import('@/iron-vault-academy-unlocked'),
  { ssr: false, loading: () => null }
)

export default function AcademyPage() {
  const { ready, authenticated, getAccessToken } = usePrivy()
  const [scope, setScope] = useState<{ allowedModules: number[]; accessType: string } | null>(null)

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
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [authenticated, getAccessToken, ready])

  return (
    <div className="-mx-4 -my-6 sm:-mx-6 lg:-mx-8">
      <IronVaultAcademyUnlocked
        allowedModules={scope?.allowedModules ?? [1, 2, 3, 4, 5, 6]}
        accessType={scope?.accessType ?? 'all_modules'}
      />
    </div>
  )
}
