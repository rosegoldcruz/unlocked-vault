'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'

type Summary = {
  totalCompletions: number
  eligibleMilestones: number
  queuedPayouts: number
  processingPayouts: number
  paidPayouts: number
  failedPayouts: number
  totalAmountRawPaid: string
}

type PayoutJob = {
  id: string
  privy_user_id: string
  milestone_number: number
  wallet_address: string
  token_mint: string
  amount_raw: string
  status: string
  attempts: number
  max_attempts: number
  next_attempt_at: string | null
  last_error: string | null
  locked_at: string | null
  locked_by: string | null
  created_at: string
  updated_at: string
}

type Transaction = {
  id: string
  payout_job_id: string
  privy_user_id: string
  milestone_number: number
  wallet_address: string
  token_mint: string
  amount_raw: string
  signature: string
  status: string
  confirmed_at: string | null
  created_at: string
}

const STATUS_OPTIONS = ['all', 'queued', 'processing', 'paid', 'failed', 'canceled'] as const
const MILESTONE_OPTIONS = ['all', '1', '2', '3'] as const

function statusClasses(status: string): string {
  switch (status) {
    case 'eligible': return 'text-amber-300 border-amber-500/30 bg-amber-500/10'
    case 'queued': return 'text-sky-300 border-sky-500/30 bg-sky-500/10'
    case 'processing': return 'text-indigo-300 border-indigo-500/30 bg-indigo-500/10'
    case 'paid': return 'text-lime-300 border-lime-500/30 bg-lime-500/10'
    case 'failed': return 'text-rose-300 border-rose-500/30 bg-rose-500/10'
    case 'canceled': return 'text-zinc-400 border-zinc-700 bg-zinc-800/60'
    default: return 'text-zinc-400 border-zinc-700 bg-zinc-900/40'
  }
}

export function AdminRewardsDashboard() {
  const { ready, authenticated, getAccessToken } = usePrivy()

  const [summary, setSummary] = useState<Summary | null>(null)
  const [jobs, setJobs] = useState<PayoutJob[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>('all')
  const [milestoneFilter, setMilestoneFilter] = useState<(typeof MILESTONE_OPTIONS)[number]>('all')
  const [search, setSearch] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionJobId, setActionJobId] = useState<string | null>(null)

  const fetchJson = useCallback(async (path: string) => {
    const token = await getAccessToken()
    if (!token) throw new Error('Missing auth token')

    const response = await fetch(path, { headers: { Authorization: `Bearer ${token}` } })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      const message = payload && typeof payload.error === 'string' ? payload.error : 'Request failed'
      throw new Error(message)
    }
    return payload
  }, [getAccessToken])

  const loadData = useCallback(async () => {
    if (!ready || !authenticated) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const query = new URLSearchParams()
      if (statusFilter !== 'all') query.set('status', statusFilter)
      if (milestoneFilter !== 'all') query.set('milestone', milestoneFilter)

      const [summaryPayload, jobsPayload, txPayload] = await Promise.all([
        fetchJson('/api/admin/rewards/summary'),
        fetchJson(`/api/admin/rewards/payout-jobs${query.toString() ? `?${query.toString()}` : ''}`),
        fetchJson(`/api/admin/rewards/transactions${query.toString() ? `?${query.toString()}` : ''}`),
      ])

      setSummary(summaryPayload as Summary)
      setJobs((jobsPayload as { jobs: PayoutJob[] }).jobs ?? [])
      setTransactions((txPayload as { transactions: Transaction[] }).transactions ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load admin rewards data')
    } finally {
      setLoading(false)
    }
  }, [authenticated, fetchJson, milestoneFilter, ready, statusFilter])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const filteredJobs = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return jobs

    return jobs.filter((job) => {
      return (
        job.privy_user_id.toLowerCase().includes(needle)
        || job.wallet_address.toLowerCase().includes(needle)
        || job.id.toLowerCase().includes(needle)
      )
    })
  }, [jobs, search])

  async function retryJob(id: string) {
    setActionJobId(id)
    setError(null)
    try {
      await fetchJson(`/api/admin/rewards/payout-jobs/${id}/retry`)
      await loadData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retry payout job')
    } finally {
      setActionJobId(null)
    }
  }

  async function cancelJob(id: string) {
    setActionJobId(id)
    setError(null)
    try {
      await fetchJson(`/api/admin/rewards/payout-jobs/${id}/cancel`)
      await loadData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to cancel payout job')
    } finally {
      setActionJobId(null)
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-lime-300 mb-2">Admin</p>
        <h1 className="text-3xl font-semibold text-zinc-100 mb-2">Reward Operations</h1>
        <p className="text-zinc-400">Monitor milestones, payout jobs, and transaction history.</p>
      </div>

      {loading ? <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5 text-sm text-zinc-400">Loading admin rewards...</div> : null}
      {error ? <div className="rounded-xl border border-rose-900/40 bg-zinc-950/50 p-5 text-sm text-rose-300">{error}</div> : null}

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4"><p className="text-xs text-zinc-500">Completions</p><p className="text-xl text-zinc-100">{summary.totalCompletions}</p></div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4"><p className="text-xs text-zinc-500">Eligible</p><p className="text-xl text-zinc-100">{summary.eligibleMilestones}</p></div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4"><p className="text-xs text-zinc-500">Queued / Processing</p><p className="text-xl text-zinc-100">{summary.queuedPayouts} / {summary.processingPayouts}</p></div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4"><p className="text-xs text-zinc-500">Paid / Failed</p><p className="text-xl text-zinc-100">{summary.paidPayouts} / {summary.failedPayouts}</p></div>
        </div>
      ) : null}

      {summary ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-1">Total Raw Amount Paid</p>
          <p className="text-sm text-lime-300 break-all">{summary.totalAmountRawPaid}</p>
        </div>
      ) : null}

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5 space-y-4">
        <div className="flex flex-wrap gap-3">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as (typeof STATUS_OPTIONS)[number])} className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100">
            {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>

          <select value={milestoneFilter} onChange={(event) => setMilestoneFilter(event.target.value as (typeof MILESTONE_OPTIONS)[number])} className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100">
            {MILESTONE_OPTIONS.map((milestone) => <option key={milestone} value={milestone}>milestone {milestone}</option>)}
          </select>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search user, wallet, or job id"
            className="min-w-[260px] flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          />

          <button
            onClick={() => void loadData()}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">Payout Jobs</p>
        <div className="space-y-3">
          {filteredJobs.length === 0 ? <p className="text-sm text-zinc-400">No jobs found.</p> : null}
          {filteredJobs.map((job) => (
            <div key={job.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-100 break-all">{job.id}</p>
                  <p className="text-xs text-zinc-400 break-all">User: {job.privy_user_id}</p>
                  <p className="text-xs text-zinc-400 break-all">Wallet: {job.wallet_address}</p>
                  <p className="text-xs text-zinc-400">Milestone {job.milestone_number} · Amount {job.amount_raw}</p>
                  <p className="text-xs text-zinc-400">Attempts {job.attempts} / {job.max_attempts}</p>
                  {job.last_error ? <p className="text-xs text-rose-300 break-all">Last Error: {job.last_error}</p> : null}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs uppercase tracking-[0.14em] ${statusClasses(job.status)}`}>
                    {job.status}
                  </span>

                  {job.status === 'failed' ? (
                    <button
                      onClick={() => void retryJob(job.id)}
                      disabled={actionJobId === job.id}
                      className="rounded-md border border-lime-400/40 bg-lime-500/10 px-3 py-1.5 text-xs text-lime-200 disabled:opacity-50"
                    >
                      {actionJobId === job.id ? 'Retrying...' : 'Retry'}
                    </button>
                  ) : null}

                  {(job.status === 'failed' || job.status === 'queued' || job.status === 'processing') ? (
                    <button
                      onClick={() => void cancelJob(job.id)}
                      disabled={actionJobId === job.id}
                      className="rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200 disabled:opacity-50"
                    >
                      {actionJobId === job.id ? 'Canceling...' : 'Cancel'}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">Transactions</p>
        <div className="space-y-3">
          {transactions.length === 0 ? <p className="text-sm text-zinc-400">No transactions found.</p> : null}
          {transactions.map((tx) => (
            <div key={tx.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-100">Milestone {tx.milestone_number}</p>
                  <p className="text-xs text-zinc-400 break-all">Signature: {tx.signature}</p>
                  <p className="text-xs text-zinc-400 break-all">User: {tx.privy_user_id}</p>
                  <p className="text-xs text-zinc-400">Amount Raw: {tx.amount_raw}</p>
                  <p className="text-xs text-zinc-400">Confirmed: {tx.confirmed_at ?? 'Pending'}</p>
                </div>
                <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs uppercase tracking-[0.14em] ${statusClasses(tx.status)}`}>
                  {tx.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
