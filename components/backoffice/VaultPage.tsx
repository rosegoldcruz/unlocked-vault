"use client"

import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useMemo, useState } from 'react'
import { Copy } from 'lucide-react'
import { fetchBackofficeJson, type BackofficePositionResponse, type BackofficeReferralCreateResponse, type BackofficeReferralsResponse } from '@/lib/backoffice-client'
import { useBackofficeAuth } from '@/hooks/useBackofficeAuth'
import type { ReferralLead, UserPosition } from '@/types/backoffice'
import { ReferralHub } from './ReferralHub'

type StatusFlag = 'YES' | 'NO' | 'DISCONTINUED'

function StatusBadge({ value }: { value: StatusFlag | string }) {
  const classes =
    value === 'YES' ? 'border-lime-300/40 bg-lime-300/10 text-lime-200'
    : value === 'DISCONTINUED' ? 'border-amber-400/40 bg-amber-400/10 text-amber-200'
    : 'border-zinc-700 bg-zinc-900 text-zinc-300'
  return <span className={`rounded-md border px-2.5 py-1 text-xs font-medium ${classes}`}>{value}</span>
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
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  const referralLink = useMemo(() => {
    if (!profile?.referral_code || typeof window === 'undefined') return ''
    return `${window.location.origin}?ref=${encodeURIComponent(profile.referral_code)}`
  }, [profile?.referral_code])

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

  const copyLink = async () => {
    if (!referralLink) { setCopyState('failed'); return }
    try { await navigator.clipboard.writeText(referralLink); setCopyState('copied'); window.setTimeout(() => setCopyState('idle'), 1500) }
    catch { setCopyState('failed') }
  }

  const participationRows = position ? [
    { label: '2% Royalty Positions', value: position.royalty_2_percent_status },
    { label: '1% Royalty Positions', value: position.royalty_1_percent_status },
    { label: 'Ownership Positions', value: position.ownership_position_status },
    { label: 'Equity', value: position.equity_status },
    { label: 'Winning Portfolio', value: position.winning_portfolio_status },
    { label: '2% Dividend', value: 'NO' },
    { label: '3% Dividend', value: 'NO' },
    { label: 'Leads', value: 'NO' },
    { label: 'Token Balance', value: position.token_balance > 0 ? 'YES' : 'NO' },
    { label: 'Bitcoin Mining', value: 'NO' },
    { label: 'VIP / Bonus Status', value: profile?.role === 'VIP' || profile?.role === 'ADMIN' ? 'YES' : 'NO' },
  ] : []

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 transition-colors duration-200">
        <p className="text-xs uppercase tracking-[0.24em] text-lime-300 mb-1">Community Participation</p>
        <h1 className="text-3xl font-semibold text-zinc-100">Vault</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Participation Matrix */}
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 transition-colors duration-200">
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Vault Participation Matrix</h2>
            {posLoading ? (
              <p className="text-sm text-zinc-400">Loading position data...</p>
            ) : posError ? (
              <p className="text-sm text-red-300">{posError}</p>
            ) : (
              <div className="space-y-2">
                {participationRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-black/20 px-4 py-3">
                    <span className="text-sm text-zinc-300">{row.label}</span>
                    <StatusBadge value={row.value} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Investment Summary */}
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 transition-colors duration-200">
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Investment Summary</h2>
            {posLoading ? (
              <p className="text-sm text-zinc-400">Loading...</p>
            ) : posError ? (
              <p className="text-sm text-red-300">{posError}</p>
            ) : position ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: 'Investment Total', value: formatCurrency(position.investment_total) },
                  { label: 'Advance Amount', value: formatCurrency(position.advance_amount) },
                  { label: 'Royalty Spent', value: formatCurrency(position.royalty_spent) },
                  { label: 'Token Balance', value: formatNumber(position.token_balance) },
                  { label: 'Dividends Total', value: formatCurrency(position.dividends_total) },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-white/10 bg-black/30 backdrop-blur-sm p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">{item.label}</p>
                    <p className="text-xl font-semibold text-zinc-100">{item.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">No position data available.</p>
            )}
          </div>

          {/* Resource / Education block */}
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 transition-colors duration-200">
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">Resources &amp; Education</h2>
            <div className="space-y-3">
              {[
                { title: 'Iron Vault Academy', desc: 'Complete all 6 modules to unlock your full token allocation.' },
                { title: 'Vault Fundamentals', desc: 'Understanding royalty positions, dividends, and token mechanics.' },
                { title: 'Referral Program', desc: 'Refer qualified members and track your network growth.' },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border border-white/[0.07] bg-black/20 p-4">
                  <p className="text-sm font-semibold text-zinc-100 mb-1">{item.title}</p>
                  <p className="text-xs text-zinc-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Referral Link box */}
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 transition-colors duration-200">
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">Your Referral Link</h2>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">Code: {profile?.referral_code ?? 'Unavailable'}</p>
            <p className="text-sm text-zinc-400 break-all mb-4">{referralLink || 'Referral link available after profile sync.'}</p>
            <button type="button" onClick={copyLink} className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-100 hover:border-lime-300/40 hover:text-lime-200">
              <Copy className="h-4 w-4" />
              {copyState === 'copied' ? 'Copied!' : copyState === 'failed' ? 'Copy failed' : 'Copy referral link'}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN — referrals */}
        <div>
          <ReferralHub />
        </div>
      </div>
    </section>
  )
}
