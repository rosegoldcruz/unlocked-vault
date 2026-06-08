"use client"

import { usePrivy } from '@privy-io/react-auth'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Copy, Link2 } from 'lucide-react'
import { fetchBackofficeJson, type BackofficeReferralCreateResponse, type BackofficeReferralsResponse } from '@/lib/backoffice-client'
import { useBackofficeAuth } from '@/hooks/useBackofficeAuth'
import type { ReferralLead } from '@/types/backoffice'
import { IronVaultLoader } from '@/components/ui/iron-vault-loader'

type ReferralFormState = { name: string; phone: string; relationship: string; bestTimeToCall: string; profession: string; linkSent: boolean }
const defaultForm: ReferralFormState = { name: '', phone: '', relationship: '', bestTimeToCall: 'ANYTIME', profession: '', linkSent: false }

export function ReferralHub() {
  const { profile } = useBackofficeAuth()
  const { ready, authenticated, getAccessToken } = usePrivy()
  const [referrals, setReferrals] = useState<ReferralLead[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [form, setForm] = useState<ReferralFormState>(defaultForm)

  const referralLink = useMemo(() => {
    if (!profile?.referral_code || typeof window === 'undefined') return ''
    return `${window.location.origin}?ref=${encodeURIComponent(profile.referral_code)}`
  }, [profile?.referral_code])

  useEffect(() => {
    if (!ready || !authenticated) return
    const load = async () => {
      try {
        setLoading(true); setError(null)
        const token = await getAccessToken()
        if (!token) throw new Error('Unauthorized: unable to retrieve access token')
        const payload = await fetchBackofficeJson<BackofficeReferralsResponse>('/api/backoffice/referrals', token)
        setReferrals(payload.referrals)
      } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to load referrals') } finally { setLoading(false) }
    }
    void load()
  }, [authenticated, getAccessToken, ready])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) { setError('Name and phone are required'); return }
    try {
      setSubmitting(true); setError(null)
      const token = await getAccessToken()
      if (!token) throw new Error('Unauthorized: unable to retrieve access token')
      const payload = await fetchBackofficeJson<BackofficeReferralCreateResponse>('/api/backoffice/referrals', token, { method: 'POST', body: { name: form.name, phone: form.phone, relationship: form.relationship, bestTimeToCall: form.bestTimeToCall, profession: form.profession, linkSent: form.linkSent } })
      setReferrals((prev) => [payload.referral, ...prev])
      setForm(defaultForm)
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to submit referral lead') } finally { setSubmitting(false) }
  }

  const copyReferralLink = async () => {
    if (!referralLink) { setCopyState('failed'); return }
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 1500)
    } catch { setCopyState('failed') }
  }

  return (
    <section className="space-y-6">
      <div className="iv-panel iv-panel-lime p-6 sm:p-8">
        <p className="iv-label mb-2">Network</p>
        <h1 className="iv-title mb-3 text-6xl">Referrals</h1>
        <p className="iv-body mb-5 text-sm">Commission tracking pending</p>
        <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="iv-panel p-5 sm:p-6">
            <p className="iv-label-muted mb-2">Referral code</p>
            <p className="iv-card-title text-5xl text-lime-300">{profile?.referral_code ?? 'Unavailable'}</p>
            <div className="mt-4 rounded border border-[#1a1a1a] bg-black/45 p-4">
              <p className="iv-label-muted mb-2">Referral link</p>
              <p className="break-all font-mono text-sm leading-6 text-zinc-200">{referralLink || 'Referral link available after profile sync.'}</p>
            </div>
            <button type="button" onClick={copyReferralLink} className="iv-button-ghost mt-5 inline-flex items-center gap-2 px-5 py-3 text-xs">
              <Copy className="h-4 w-4" />
              {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy referral link'}
            </button>
          </div>
          <div className="iv-panel p-5 sm:p-6">
            <p className="iv-label-muted mb-2">Total referrals</p>
            <p className="iv-title text-7xl text-lime-300">{referrals.length}</p>
            <p className="iv-body mt-2 text-sm">Track your lead submissions and update outreach details from this page.</p>
          </div>
        </div>
      </div>
      <div className="grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
        <form onSubmit={handleSubmit} className="iv-panel space-y-5 p-6 sm:p-8">
          <h2 className="iv-card-title text-4xl">Referral Form</h2>
          {([['name', 'Referral Name'], ['phone', 'Phone'], ['relationship', 'Relationship with Referral'], ['profession', 'Profession']] as const).map(([field, label]) => (
            <div key={field}>
              <label htmlFor={`ref-${field}`} className="iv-label-muted mb-1.5 block">{label}</label>
              <input id={`ref-${field}`} value={form[field]} onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))} className="iv-field min-h-12 w-full px-4 py-3 text-base" required={field === 'name' || field === 'phone'} />
            </div>
          ))}
          <div>
            <label htmlFor="ref-best-time" className="iv-label-muted mb-1.5 block">Best Time to Call</label>
            <select id="ref-best-time" value={form.bestTimeToCall} onChange={(e) => setForm((prev) => ({ ...prev, bestTimeToCall: e.target.value }))} className="iv-field min-h-12 w-full px-4 py-3 text-base">
              <option value="ANYTIME">Anytime</option>
              <option value="MORNING">Morning</option>
              <option value="AFTERNOON">Afternoon</option>
              <option value="EVENING">Evening</option>
            </select>
          </div>
          <div>
            <label htmlFor="ref-link-sent" className="iv-label-muted mb-1.5 block">Link Sent?</label>
            <select id="ref-link-sent" value={form.linkSent ? 'YES' : 'NO'} onChange={(e) => setForm((prev) => ({ ...prev, linkSent: e.target.value === 'YES' }))} className="iv-field min-h-12 w-full px-4 py-3 text-base">
              <option value="NO">No</option>
              <option value="YES">Yes</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button type="submit" disabled={submitting} className="iv-button inline-flex w-full items-center justify-center gap-2 px-6 py-4 text-lg disabled:opacity-50">
            <Link2 className="h-4 w-4" />
            {submitting ? 'Submitting...' : 'Refer & Collect'}
          </button>
        </form>
        <div className="iv-panel p-6 sm:p-8">
          <h2 className="iv-card-title mb-4 text-4xl">Referral Leads</h2>
          {loading ? <IronVaultLoader label="Referral engine activating" variant="inline" /> : referrals.length === 0 ? <p className="text-sm text-zinc-400">No referral leads submitted yet.</p> : (
            <div className="space-y-3">
              {referrals.map((lead) => (
                <article key={lead.id} className="rounded border border-[#1a1a1a] bg-[#080808]/90 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="iv-card-title text-2xl">{lead.name}</p><p className="text-sm text-zinc-400">{lead.phone}</p></div>
                    <span className="rounded border border-[#2a2a2a] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">{lead.status}</span>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-zinc-400 sm:grid-cols-2">
                    <p>Relationship: {lead.relationship ?? 'N/A'}</p>
                    <p>Best time: {lead.best_time_to_call ?? 'N/A'}</p>
                    <p>Profession: {lead.profession ?? 'N/A'}</p>
                    <p>Link sent: {lead.link_sent ? 'Yes' : 'No'}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
