"use client"

import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'
import { fetchBackofficeJson, type BackofficePositionResponse } from '@/lib/backoffice-client'
import { useBackofficeAuth } from '@/hooks/useBackofficeAuth'
import type { UserPosition } from '@/types/backoffice'

type StatusFlag = 'YES' | 'NO' | 'DISCONTINUED'

function StatusBadge({ value }: { value: StatusFlag | string }) {
  const classes =
    value === 'YES' ? 'border-lime-300/40 bg-lime-300/10 text-lime-200'
    : value === 'DISCONTINUED' ? 'border-amber-400/40 bg-amber-400/10 text-amber-200'
    : 'border-[#2a2a2a] bg-[#141414] text-zinc-400'
  return <span className={`rounded border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${classes}`}>{value}</span>
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value)
}

export function VaultPage() {
  const { profile } = useBackofficeAuth()
  const { ready, authenticated, getAccessToken } = usePrivy()
  const [position, setPosition] = useState<UserPosition | null>(null)
  const [posLoading, setPosLoading] = useState(true)
  const [posError, setPosError] = useState<string | null>(null)

  useEffect(() => {
    if (!ready || !authenticated) return
    const load = async () => {
      try {
        setPosLoading(true); setPosError(null)
        const token = await getAccessToken()
        if (!token) throw new Error('Unauthorized: unable to retrieve access token')
        const payload = await fetchBackofficeJson<BackofficePositionResponse>('/api/backoffice/positions', token)
        setPosition(payload.position)
      } catch (err: unknown) { setPosError(err instanceof Error ? err.message : 'Failed to load position data') } finally { setPosLoading(false) }
    }
    void load()
  }, [authenticated, getAccessToken, ready])

  const participationRows = position ? [
    { label: '2% Royalty Positions', value: position.royalty_2_percent_status },
    { label: '1% Royalty Positions', value: position.royalty_1_percent_status },
    { label: 'Ownership Positions', value: position.ownership_position_status },
    { label: 'Equity', value: position.equity_status },
    { label: 'Winning Portfolio', value: position.winning_portfolio_status },
    { label: '2% Dividend', value: 'NO' },
    { label: '3% Dividend', value: 'NO' },
    { label: 'Token Balance', value: position.token_balance > 0 ? 'YES' : 'NO' },
    { label: 'Bitcoin Mining', value: 'NO' },
    { label: 'VIP / Bonus Status', value: profile?.role === 'VIP' || profile?.role === 'ADMIN' ? 'YES' : 'NO' },
  ] : []

  return (
    <section className="space-y-6">
      <div className="iv-panel iv-panel-lime p-6">
        <p className="iv-label mb-1">Community Participation</p>
        <h1 className="iv-title text-5xl">Vault</h1>
      </div>

      {posLoading ? null : posError ? (
        <div className="rounded border border-rose-900/40 bg-[#0f0f0f] p-5 text-sm text-rose-300">{posError}</div>
      ) : (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <div className="iv-panel p-6">
          <h2 className="iv-card-title mb-4 text-3xl">Vault Participation Matrix</h2>
          {position ? (
            <div className="space-y-2">
              {participationRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded border border-[#1a1a1a] bg-[#080808] px-4 py-3">
                  <span className="text-sm text-zinc-300">{row.label}</span>
                  <StatusBadge value={row.value} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">No position data available.</p>
          )}
        </div>

        <div className="space-y-6">
          <div className="iv-panel iv-panel-lime p-6">
            <h2 className="iv-card-title mb-4 text-3xl">Investment Summary</h2>
            {position ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {[
                  { label: 'Investment Total', value: formatCurrency(position.investment_total) },
                  { label: 'Advance Amount', value: formatCurrency(position.advance_amount) },
                  { label: 'Royalty Spent', value: formatCurrency(position.royalty_spent) },
                  { label: 'Token Balance', value: formatNumber(position.token_balance) },
                  { label: 'Dividends Total', value: formatCurrency(position.dividends_total) },
                ].map((item) => (
                  <div key={item.label} className="iv-panel p-4">
                    <p className="iv-label-muted mb-2">{item.label}</p>
                    <p className="iv-card-title text-3xl text-lime-300">{item.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">No position data available.</p>
            )}
          </div>

          <div className="iv-panel p-6">
            <h2 className="iv-card-title mb-3 text-3xl">Resources &amp; Education</h2>
            <div className="space-y-3">
              {[
                { title: 'Iron Vault Academy', desc: 'Complete all 6 modules to unlock your full token allocation.' },
                { title: 'Vault Fundamentals', desc: 'Understanding royalty positions, dividends, and token mechanics.' },
                { title: 'Position Status', desc: 'Review royalty, ownership, equity, dividend, token, and VIP status from your vault matrix.' },
              ].map((item) => (
                <div key={item.title} className="rounded border border-[#1a1a1a] bg-[#080808] p-4">
                  <p className="iv-card-title mb-1 text-xl">{item.title}</p>
                  <p className="iv-body text-xs">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      )}
    </section>
  )
}
