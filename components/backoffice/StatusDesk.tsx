"use client"

import { usePrivy } from '@privy-io/react-auth'
import { type FormEvent, useEffect, useState } from 'react'
import { fetchBackofficeJson, type BackofficeTicketCreateResponse, type BackofficeTicketsResponse } from '@/lib/backoffice-client'
import type { StatusTicket } from '@/types/backoffice'
import { useBackofficeAuth } from '@/hooks/useBackofficeAuth'

export function StatusDesk() {
  const { profile } = useBackofficeAuth()
  const { ready, authenticated, getAccessToken } = usePrivy()
  const [tickets, setTickets] = useState<StatusTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: profile?.email ?? '', subject: '', message: '' })

  useEffect(() => { setForm((prev) => ({ ...prev, email: profile?.email ?? '' })) }, [profile?.email])

  useEffect(() => {
    if (!ready || !authenticated) return
    const load = async () => {
      try {
        setLoading(true); setError(null)
        const token = await getAccessToken()
        if (!token) throw new Error('Unauthorized: unable to retrieve access token')
        const payload = await fetchBackofficeJson<BackofficeTicketsResponse>('/api/backoffice/tickets', token)
        setTickets(payload.tickets)
      } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to load tickets') } finally { setLoading(false) }
    }
    void load()
  }, [authenticated, getAccessToken, ready])

  const submitTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.subject.trim() || !form.message.trim()) { setError('Subject and message are required'); return }
    try {
      setSubmitting(true); setError(null)
      const token = await getAccessToken()
      if (!token) throw new Error('Unauthorized: unable to retrieve access token')
      const payload = await fetchBackofficeJson<BackofficeTicketCreateResponse>('/api/backoffice/tickets', token, { method: 'POST', body: { name: form.name, email: form.email, subject: form.subject, message: form.message } })
      setTickets((prev) => [payload.ticket, ...prev])
      setForm((prev) => ({ ...prev, subject: '', message: '' }))
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to submit ticket') } finally { setSubmitting(false) }
  }

  return (
    <section className="space-y-6">
      <div className="iv-panel iv-panel-lime p-6">
        <p className="iv-label mb-2">Support</p>
        <h1 className="iv-title mb-2 text-5xl">Status Desk</h1>
        <p className="iv-body text-sm">Send a support request and follow response updates from your ticket timeline.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={submitTicket} className="iv-panel space-y-4 p-6">
          <h2 className="iv-card-title text-3xl">Create Ticket</h2>
          {(['name', 'email', 'subject'] as const).map((field) => (
            <div key={field}>
              <label htmlFor={`ticket-${field}`} className="iv-label-muted mb-1.5 block">{field}</label>
              <input id={`ticket-${field}`} value={form[field]} onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))} className="iv-field w-full px-3 py-2 text-sm" required={field === 'subject'} />
            </div>
          ))}
          <div>
            <label htmlFor="ticket-message" className="iv-label-muted mb-1.5 block">Message</label>
            <textarea id="ticket-message" value={form.message} onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))} className="iv-field min-h-32 w-full px-3 py-2 text-sm" required />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button type="submit" disabled={submitting} className="iv-button inline-flex items-center justify-center px-4 py-2 text-sm disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit ticket'}
          </button>
        </form>
        <div className="iv-panel p-6">
          <h2 className="iv-card-title mb-4 text-3xl">Your Tickets</h2>
          {!loading && tickets.length === 0 ? <p className="text-sm text-zinc-400">No tickets submitted yet.</p> : !loading ? (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <article key={ticket.id} className="rounded border border-[#1a1a1a] bg-[#080808] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div><h3 className="iv-card-title text-xl">{ticket.subject}</h3><p className="text-xs text-zinc-400">{new Date(ticket.created_at).toLocaleString()}</p></div>
                    <span className="rounded border border-[#2a2a2a] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">{ticket.status}</span>
                  </div>
                  <p className="mt-3 text-sm text-zinc-300 whitespace-pre-wrap">{ticket.message}</p>
                  {ticket.admin_response && <div className="iv-chip-lime mt-3 rounded p-3"><p className="iv-label-muted mb-2 text-lime-200">Admin response</p><p className="text-sm text-zinc-100 whitespace-pre-wrap">{ticket.admin_response}</p></div>}
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
