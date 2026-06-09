"use client"

import { useBackofficeAuth } from '@/hooks/useBackofficeAuth'

export function AccountPanel() {
  const { profile } = useBackofficeAuth()

  return (
    <section className="space-y-6">
      <div className="iv-panel iv-panel-lime p-6">
        <p className="iv-label mb-2">Member Identity</p>
        <h1 className="iv-title mb-2 text-5xl">Account</h1>
        <p className="iv-body text-sm">Profile values are sourced from your authenticated Iron Vault member identity.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="iv-panel p-4">
          <p className="iv-label-muted mb-2">Email</p>
          <p className="text-sm text-zinc-100 break-all">{profile?.email ?? 'No email on file'}</p>
        </div>
        <div className="iv-panel p-4">
          <p className="iv-label-muted mb-2">Current tier</p>
          <p className="text-sm text-zinc-100">{profile?.current_tier ?? 'MEMBER'}</p>
        </div>
        <div className="iv-panel p-4">
          <p className="iv-label-muted mb-2">Role</p>
          <p className="text-sm text-zinc-100">{profile?.role ?? 'MEMBER'}</p>
        </div>
        <div className="iv-panel p-4">
          <p className="iv-label-muted mb-2">Referral code</p>
          <p className="text-sm text-zinc-100">{profile?.referral_code ?? 'Unavailable'}</p>
        </div>
        <div className="iv-panel p-4">
          <p className="iv-label-muted mb-2">EVM Wallet</p>
          <p className="text-sm text-zinc-100 break-all">{profile?.evm_wallet_address ?? 'No EVM wallet linked'}</p>
        </div>
        <div className="iv-panel p-4">
          <p className="iv-label-muted mb-2">Solana IVT Wallet</p>
          <p className="text-sm text-zinc-100 break-all">{profile?.solana_ivt_wallet_address ?? 'Solana wallet not found'}</p>
          {profile?.solana_explorer_wallet_url ? (
            <a className="mt-3 inline-flex text-xs font-semibold uppercase tracking-[0.12em] text-lime-300 hover:text-lime-200" href={profile.solana_explorer_wallet_url} target="_blank" rel="noreferrer">
              View Wallet on Solana Explorer
            </a>
          ) : null}
        </div>
        <div className="iv-panel p-4">
          <p className="iv-label-muted mb-2">Vault XP</p>
          <p className="text-sm text-zinc-100">{profile?.vault_xp?.toLocaleString() ?? '0'}</p>
        </div>
      </div>
    </section>
  )
}
