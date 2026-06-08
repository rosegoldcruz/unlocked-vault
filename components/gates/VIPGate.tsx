"use client"

import type { ReactNode } from 'react'
import { useBackofficeAuth } from '@/hooks/useBackofficeAuth'

export function VIPGate({ children }: { children: ReactNode }) {
  const { loading, isVip, isAdmin } = useBackofficeAuth()

  if (loading) return null

  if (isVip || isAdmin) return <>{children}</>

  return (
    <div className="iv-panel min-h-[420px] grid place-items-center p-8">
      <div className="text-center max-w-sm">
        <div className="iv-chip-purple mb-4 inline-flex h-14 w-14 items-center justify-center rounded">
          <span className="text-2xl">🔒</span>
        </div>
        <h2 className="text-2xl font-semibold text-zinc-100 mb-3">Become VIP to access</h2>
        <p className="text-sm text-zinc-400 mb-6">Upgrade your Iron Vault tier to unlock VIP access and premium features.</p>
        <p className="text-xs text-zinc-500">Contact your Iron Vault representative to upgrade your membership tier.</p>
      </div>
    </div>
  )
}
