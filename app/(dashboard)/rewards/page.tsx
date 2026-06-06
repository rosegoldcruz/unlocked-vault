'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'

type RewardStatusPayload = {
  walletAddress: string | null
  completedModules: number[]
  milestones: Array<{
    milestoneNumber: number
    moduleStart: number
    moduleEnd: number
    status: string
    eligibleAt: string | null
  }>
  payoutJobs: Array<{
    milestoneNumber: number
    status: string
    amountRaw: string
    tokenMint: string
    attempts: number
    lastError: string | null
  }>
  transactions: Array<{
    milestoneNumber: number
    signature: string
    status: string
    confirmedAt: string | null
  }>
  nextRequiredModule: number | null
  walletMissing: boolean
}

const STATUS_COLORS: Record<string, string> = {
  locked: 'text-zinc-400 border-zinc-700 bg-zinc-900/40',
  eligible: 'text-amber-300 border-amber-400/40 bg-amber-500/10',
  queued: 'text-sky-300 border-sky-400/40 bg-sky-500/10',
  processing: 'text-indigo-300 border-indigo-400/40 bg-indigo-500/10',
  paid: 'text-lime-300 border-lime-400/40 bg-lime-500/10',
  failed: 'text-rose-300 border-rose-400/40 bg-rose-500/10',
  canceled: 'text-zinc-400 border-zinc-600 bg-zinc-800/60',
}

function statusClasses(status: string): string {
  return STATUS_COLORS[status] ?? STATUS_COLORS.locked
}

export default function RewardsPage() {
  const { ready, authenticated, getAccessToken } = usePrivy()
  const [data, setData] = useState<RewardStatusPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadRewardStatus() {
      if (!ready || !authenticated) {
        if (!cancelled) {
          setData(null)
          setError(null)
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setError(null)

      try {
        const token = await getAccessToken()
        if (!token) throw new Error('Unable to load rewards: missing auth token')

        const response = await fetch('/api/rewards/status', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const payload = (await response.json().catch(() => null)) as RewardStatusPayload | { error?: string } | null

        if (!response.ok) {
          const message = payload && 'error' in payload && typeof payload.error === 'string'
            ? payload.error
            : 'Unable to load rewards status'
          throw new Error(message)
        }

        if (!cancelled) {
          setData(payload as RewardStatusPayload)
          setError(null)
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setData(null)
          setError(err instanceof Error ? err.message : 'Unable to load rewards status')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadRewardStatus()

    return () => {
      cancelled = true
    }
  }, [authenticated, getAccessToken, ready])

  const completionSet = useMemo(() => new Set(data?.completedModules ?? []), [data?.completedModules])

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-lime-300 mb-2">Rewards</p>
        <h1 className="text-3xl font-semibold text-zinc-100 mb-2">Reward Milestones</h1>
        <p className="text-zinc-400 max-w-2xl">
          Complete all academy modules. Rewards unlock at module milestones 2, 4, and 6.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5 text-sm text-zinc-400">Loading reward status...</div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-900/40 bg-zinc-950/50 p-5 text-sm text-rose-300">{error}</div>
      ) : null}

      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">Wallet</p>
              <p className="text-sm text-zinc-100 break-all">{data.walletAddress ?? 'No wallet detected'}</p>
              {data.walletMissing ? (
                <p className="mt-3 text-sm text-amber-300">Wallet required before eligible milestones can be queued.</p>
              ) : null}
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">Next Required Module</p>
              <p className="text-sm text-zinc-100">{data.nextRequiredModule ?? 'All modules complete'}</p>
              <p className="mt-3 text-xs text-zinc-400">Completed: {(data.completedModules ?? []).join(', ') || 'None yet'}</p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">Modules 1-6</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }, (_, index) => {
                const moduleNumber = index + 1
                const completed = completionSet.has(moduleNumber)

                return (
                  <div
                    key={moduleNumber}
                    className={`rounded-lg border px-3 py-2 text-center text-sm ${
                      completed
                        ? 'border-lime-400/40 bg-lime-500/10 text-lime-200'
                        : 'border-zinc-700 bg-zinc-900/40 text-zinc-400'
                    }`}
                  >
                    Module {moduleNumber}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">Milestones</p>
            <div className="space-y-3">
              {data.milestones.map((milestone) => (
                <div key={milestone.milestoneNumber} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">
                        Milestone {milestone.milestoneNumber} · Modules {milestone.moduleStart}-{milestone.moduleEnd}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        Eligible At: {milestone.eligibleAt ?? 'Not yet eligible'}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs uppercase tracking-[0.14em] ${statusClasses(milestone.status)}`}>
                      {milestone.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">Payout Jobs</p>
            {data.payoutJobs.length === 0 ? (
              <p className="text-sm text-zinc-400">No payout jobs yet.</p>
            ) : (
              <div className="space-y-3">
                {data.payoutJobs.map((job) => (
                  <div key={`${job.milestoneNumber}-${job.status}-${job.attempts}`} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">Milestone {job.milestoneNumber}</p>
                        <p className="text-xs text-zinc-400 mt-1">Amount Raw: {job.amountRaw}</p>
                        <p className="text-xs text-zinc-400">Token Mint: {job.tokenMint}</p>
                        <p className="text-xs text-zinc-400">Attempts: {job.attempts}</p>
                        {job.lastError ? <p className="text-xs text-rose-300 mt-1">Last Error: {job.lastError}</p> : null}
                      </div>
                      <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs uppercase tracking-[0.14em] ${statusClasses(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">Transactions</p>
            {data.transactions.length === 0 ? (
              <p className="text-sm text-zinc-400">No transactions yet.</p>
            ) : (
              <div className="space-y-3">
                {data.transactions.map((transaction) => (
                  <div key={transaction.signature} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">Milestone {transaction.milestoneNumber}</p>
                        <p className="text-xs text-zinc-400 mt-1 break-all">Signature: {transaction.signature}</p>
                        <p className="text-xs text-zinc-400">Confirmed At: {transaction.confirmedAt ?? 'Pending confirmation'}</p>
                      </div>
                      <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs uppercase tracking-[0.14em] ${statusClasses(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </section>
  )
}
