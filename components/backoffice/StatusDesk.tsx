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
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 transition-colors duration-200">
        <h1 className="text-2xl font-semibold text-zinc-100 mb-2">Status Desk</h1>
        <p className="text-sm text-zinc-400">Send a support request and follow response updates from your ticket timeline.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={submitTicket} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-100">Create Ticket</h2>
          {(['name', 'email', 'subject'] as const).map((field) => (
            <div key={field}>
              <label htmlFor={`ticket-${field}`} className="mb-1.5 block text-sm text-zinc-300 capitalize">{field}</label>
              <input id={`ticket-${field}`} value={form[field]} onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))} className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-lime-400/30" required={field === 'subject'} />
            </div>
          ))}
          <div>
            <label htmlFor="ticket-message" className="mb-1.5 block text-sm text-zinc-300">Message</label>
            <textarea id="ticket-message" value={form.message} onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))} className="min-h-32 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-lime-400/30" required />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button type="submit" disabled={submitting} className="inline-flex items-center justify-center rounded-md bg-lime-300 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-lime-200 disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit ticket'}
          </button>
        </form>
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 transition-colors duration-200">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">Your Tickets</h2>
          {loading ? <p className="text-sm text-zinc-400">Loading tickets...</p> : tickets.length === 0 ? <p className="text-sm text-zinc-400">No tickets submitted yet.</p> : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <article key={ticket.id} className="rounded-lg border border-white/[0.07] bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div><h3 className="text-sm font-semibold text-zinc-100">{ticket.subject}</h3><p className="text-xs text-zinc-400">{new Date(ticket.created_at).toLocaleString()}</p></div>
                    <span className="rounded-md border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300">{ticket.status}</span>
                  </div>
                  <p className="mt-3 text-sm text-zinc-300 whitespace-pre-wrap">{ticket.message}</p>
                  {ticket.admin_response && <div className="mt-3 rounded-md border border-lime-300/30 bg-lime-300/10 p-3"><p className="text-xs uppercase tracking-[0.2em] text-lime-200 mb-2">Admin response</p><p className="text-sm text-zinc-100 whitespace-pre-wrap">{ticket.admin_response}</p></div>}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
