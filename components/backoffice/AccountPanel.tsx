"use client"

import { useBackofficeAuth } from '@/hooks/useBackofficeAuth'

export function AccountPanel() {
  const { profile } = useBackofficeAuth()

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
        <h1 className="text-2xl font-semibold text-zinc-100 mb-2">Account</h1>
        <p className="text-sm text-zinc-400">Profile values are sourced from your authenticated Iron Vault member identity.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">Email</p>
          <p className="text-sm text-zinc-100 break-all">{profile?.email ?? 'No email on file'}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">Current tier</p>
          <p className="text-sm text-zinc-100">{profile?.current_tier ?? 'MEMBER'}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">Role</p>
          <p className="text-sm text-zinc-100">{profile?.role ?? 'MEMBER'}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">Referral code</p>
          <p className="text-sm text-zinc-100">{profile?.referral_code ?? 'Unavailable'}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">Wallet address</p>
          <p className="text-sm text-zinc-100 break-all">{profile?.wallet_address ?? 'No wallet linked'}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">Vault XP</p>
          <p className="text-sm text-zinc-100">{profile?.vault_xp?.toLocaleString() ?? '0'}</p>
        </div>
      </div>
    </section>
  )
}
