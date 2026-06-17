'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'

type RewardStatusPayload = {
  walletAddress: string | null
  evmWalletAddress: string | null
  solanaIvtWalletAddress: string | null
  solanaIvtWalletSource: 'profile' | 'privy' | 'none'
  solanaExplorerWalletUrl: string | null
  ivtTokenMint: string
  ivtTokenMintExplorerUrl: string
  ivtTokenBalance: {
    amountRaw: string
    decimals: number
    uiAmount: string
  } | null
  completedModules: number[]
  accessScope: {
    accessType: 'all_modules' | 'single_module' | 'admin'
    allowedModules: number[]
    rewardTrack?: 'full_academy' | 'single_module'
  }
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
    rewardTrack?: string
    moduleNumber?: number | null
  }>
  transactions: Array<{
    milestoneNumber: number
    signature: string
    status: string
    confirmedAt: string | null
    explorerUrl: string | null
  }>
  nextRequiredModule: number | null
  walletMissing: boolean
}

const STATUS_COLORS: Record<string, string> = {
  locked: 'text-zinc-400 border-[#2a2a2a] bg-[#141414]',
  eligible: 'text-amber-300 border-amber-400/40 bg-amber-500/10',
  queued: 'text-purple-300 border-purple-400/40 bg-purple-500/10',
  processing: 'text-purple-200 border-purple-400/40 bg-purple-500/10',
  paid: 'text-lime-300 border-lime-400/40 bg-lime-500/10',
  failed: 'text-rose-300 border-rose-400/40 bg-rose-500/10',
  canceled: 'text-zinc-400 border-zinc-600 bg-zinc-800/60',
}

function CopyButton({ value, label }: { value: string | null | undefined; label: string }) {
  if (!value) return null
  return (
    <button type="button" className="text-xs font-semibold uppercase tracking-[0.12em] text-lime-300 hover:text-lime-200" onClick={() => void navigator.clipboard.writeText(value)}>
      {label}
    </button>
  )
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
  const isSingleModule = data?.accessScope.rewardTrack === 'single_module'
  const selectedModule = data?.accessScope.allowedModules[0] ?? null

  return (
    <section className="space-y-6">
      <div className="iv-panel iv-panel-lime p-6">
        <p className="iv-label mb-2">Rewards</p>
        <h1 className="iv-title mb-2 text-5xl">Reward Milestones</h1>
        <p className="iv-body max-w-2xl text-sm">
          {isSingleModule
            ? `Single Module Access: complete Module ${selectedModule} to queue your selected-module reward.`
            : 'Complete all academy modules. Rewards unlock at module milestones 2, 4, and 6.'}
        </p>
      </div>

      {error ? (
        <div className="rounded border border-rose-900/40 bg-[#0f0f0f] p-5 text-sm text-rose-300">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="iv-panel p-5">
          <p className="iv-label-muted mb-2">Solana IVT Payout Wallet</p>
          <p className="text-sm text-zinc-100 break-all">{data?.solanaIvtWalletAddress ?? 'Solana wallet not found'}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {data?.solanaExplorerWalletUrl ? (
              <a className="inline-flex text-xs font-semibold uppercase tracking-[0.12em] text-lime-300 hover:text-lime-200" href={data.solanaExplorerWalletUrl} target="_blank" rel="noreferrer">
                View Wallet on Solscan
              </a>
            ) : null}
            <CopyButton value={data?.solanaIvtWalletAddress} label="Copy Solana Wallet" />
          </div>
          {data?.ivtTokenBalance ? (
            <p className="mt-3 text-xs text-zinc-400">IVT Balance: {data.ivtTokenBalance.uiAmount}</p>
          ) : null}
          {data?.walletMissing ? (
            <p className="mt-3 text-sm text-amber-300">Solana wallet required before eligible milestones can be queued.</p>
          ) : null}
        </div>

        <div className="iv-panel p-5">
          <p className="iv-label-muted mb-2">Next Required Module</p>
          <p className="iv-card-title text-3xl text-lime-300">{isSingleModule ? `Module ${selectedModule}` : data?.nextRequiredModule ?? '—'}</p>
          <p className="mt-3 text-xs text-zinc-400">Completed: {(data?.completedModules ?? []).join(', ') || 'None yet'}</p>
        </div>
      </div>

      <div className="iv-panel p-5">
        <p className="iv-label-muted mb-3">Modules 1-6</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => {
            const moduleNumber = index + 1
            const completed = completionSet.has(moduleNumber)

            return (
              <div
                key={moduleNumber}
                className={`rounded border px-3 py-2 text-center font-mono text-[10px] uppercase tracking-[0.12em] ${
                  completed
                    ? 'border-lime-400/40 bg-lime-500/10 text-lime-200'
                    : isSingleModule && moduleNumber !== selectedModule
                    ? 'border-[#1a1a1a] bg-[#080808] text-zinc-600'
                    : 'border-[#1a1a1a] bg-[#080808] text-zinc-400'
                }`}
              >
                Module {moduleNumber}{isSingleModule && moduleNumber !== selectedModule ? ' Locked' : ''}
              </div>
            )
          })}
        </div>
      </div>

      {!isSingleModule ? <div className="iv-panel p-5">
        <p className="iv-label-muted mb-3">Milestones</p>
        {(data?.milestones ?? []).length === 0 ? (
          <p className="text-sm text-zinc-400">No milestones yet.</p>
        ) : (
          <div className="space-y-3">
            {data!.milestones.map((milestone) => (
              <div key={milestone.milestoneNumber} className="rounded border border-[#1a1a1a] bg-[#080808] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="iv-card-title text-xl">
                      Milestone {milestone.milestoneNumber} · Modules {milestone.moduleStart}-{milestone.moduleEnd}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Eligible At: {milestone.eligibleAt ?? 'Not yet eligible'}
                    </p>
                  </div>
                  <span className={`inline-flex rounded border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${statusClasses(milestone.status)}`}>
                    {milestone.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div> : null}

      <div className="iv-panel p-5">
        <p className="iv-label-muted mb-3">Payout Jobs</p>
        {(data?.payoutJobs ?? []).length === 0 ? (
          <p className="text-sm text-zinc-400">No payout jobs yet.</p>
        ) : (
          <div className="space-y-3">
            {data!.payoutJobs.map((job) => (
              <div key={`${job.milestoneNumber}-${job.status}-${job.attempts}`} className="rounded border border-[#1a1a1a] bg-[#080808] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="iv-card-title text-xl">
                      {job.rewardTrack === 'single_module' ? `Module ${job.moduleNumber} Reward` : `Milestone ${job.milestoneNumber}`}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">Amount Raw: {job.amountRaw}</p>
                    <p className="text-xs text-zinc-400">Token Mint: {job.tokenMint}</p>
                    <p className="text-xs text-zinc-400">Attempts: {job.attempts}</p>
                    {job.lastError ? <p className="text-xs text-rose-300 mt-1">Last Error: {job.lastError}</p> : null}
                  </div>
                  <span className={`inline-flex rounded border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${statusClasses(job.status)}`}>
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="iv-panel p-5">
        <p className="iv-label-muted mb-3">Transactions</p>
        {(data?.transactions ?? []).length === 0 ? (
          <p className="text-sm text-zinc-400">No transactions yet.</p>
        ) : (
          <div className="space-y-3">
            {data!.transactions.map((transaction) => (
              <div key={transaction.signature} className="rounded border border-[#1a1a1a] bg-[#080808] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="iv-card-title text-xl">Milestone {transaction.milestoneNumber}</p>
                    <p className="text-xs text-zinc-400 mt-1 break-all">Signature: {transaction.signature}</p>
                    <p className="text-xs text-zinc-400">Confirmed At: {transaction.confirmedAt ?? 'Pending confirmation'}</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {transaction.explorerUrl ? (
                        <a className="inline-flex text-xs font-semibold uppercase tracking-[0.12em] text-lime-300 hover:text-lime-200" href={transaction.explorerUrl} target="_blank" rel="noreferrer">
                          View Payout on Solscan
                        </a>
                      ) : <p className="text-xs text-zinc-400">Payout transaction pending</p>}
                      <CopyButton value={transaction.signature} label="Copy Transaction Signature" />
                    </div>
                  </div>
                  <span className={`inline-flex rounded border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${statusClasses(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
