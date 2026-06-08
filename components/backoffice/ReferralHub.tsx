"use client"

import { usePrivy } from '@privy-io/react-auth'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Copy, Link2 } from 'lucide-react'
import { fetchBackofficeJson, type BackofficeReferralCreateResponse, type BackofficeReferralsResponse } from '@/lib/backoffice-client'
import { useBackofficeAuth } from '@/hooks/useBackofficeAuth'
import type { ReferralLead } from '@/types/backoffice'

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
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 transition-colors duration-200">
        <h1 className="text-2xl font-semibold text-zinc-100 mb-2">Network &amp; Referrals</h1>
        <p className="text-sm text-zinc-400 mb-5">Commission tracking pending</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-black/30 backdrop-blur-sm p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">Referral code</p>
            <p className="text-lg font-semibold text-zinc-100">{profile?.referral_code ?? 'Unavailable'}</p>
            <p className="mt-2 text-sm text-zinc-400 break-all">{referralLink || 'Referral link available after profile sync.'}</p>
            <button type="button" onClick={copyReferralLink} className="mt-4 inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-100 hover:border-zinc-500">
              <Copy className="h-4 w-4" />
              {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy referral link'}
            </button>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 backdrop-blur-sm p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">Total referrals</p>
            <p className="text-3xl font-semibold text-lime-200">{referrals.length}</p>
            <p className="mt-2 text-sm text-zinc-400">Track your lead submissions and update outreach details from this page.</p>
          </div>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-100">Referral Form</h2>
          {([['name', 'Referral Name'], ['phone', 'Phone'], ['relationship', 'Relationship with Referral'], ['profession', 'Profession']] as const).map(([field, label]) => (
            <div key={field}>
              <label htmlFor={`ref-${field}`} className="mb-1.5 block text-sm text-zinc-300">{label}</label>
              <input id={`ref-${field}`} value={form[field]} onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))} className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-lime-400/30" required={field === 'name' || field === 'phone'} />
            </div>
          ))}
          <div>
            <label htmlFor="ref-best-time" className="mb-1.5 block text-sm text-zinc-300">Best Time to Call</label>
            <select id="ref-best-time" value={form.bestTimeToCall} onChange={(e) => setForm((prev) => ({ ...prev, bestTimeToCall: e.target.value }))} className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-lime-400/30">
              <option value="ANYTIME">Anytime</option>
              <option value="MORNING">Morning</option>
              <option value="AFTERNOON">Afternoon</option>
              <option value="EVENING">Evening</option>
            </select>
          </div>
          <div>
            <label htmlFor="ref-link-sent" className="mb-1.5 block text-sm text-zinc-300">Link Sent?</label>
            <select id="ref-link-sent" value={form.linkSent ? 'YES' : 'NO'} onChange={(e) => setForm((prev) => ({ ...prev, linkSent: e.target.value === 'YES' }))} className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-lime-400/30">
              <option value="NO">No</option>
              <option value="YES">Yes</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-md bg-lime-300 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-lime-200 disabled:opacity-50">
            <Link2 className="h-4 w-4" />
            {submitting ? 'Submitting...' : 'Refer & Collect'}
          </button>
        </form>
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 transition-colors duration-200">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">Referral Leads</h2>
          {loading ? <p className="text-sm text-zinc-400">Loading referrals...</p> : referrals.length === 0 ? <p className="text-sm text-zinc-400">No referral leads submitted yet.</p> : (
            <div className="space-y-3">
              {referrals.map((lead) => (
                <article key={lead.id} className="rounded-lg border border-white/[0.07] bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-sm font-semibold text-zinc-100">{lead.name}</p><p className="text-xs text-zinc-400">{lead.phone}</p></div>
                    <span className="rounded-md border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300">{lead.status}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-400">
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
