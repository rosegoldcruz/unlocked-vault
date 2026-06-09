"use client"

import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Newspaper, RefreshCw, Sparkles, X } from 'lucide-react'

type DailyDefiNewsItem = {
  title: string
  url: string
  source: string
  publishedAt: string | null
  summary: string
  positiveLens: string
}

type DailyDefiNewsResponse = {
  asOf: string
  items: DailyDefiNewsItem[]
  sources: Array<{
    name: string
    url: string
    focus: string
  }>
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(value: string | null): string {
  if (!value) return 'Latest'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function DailyDefiNewsModal({ memberId }: { memberId: string | null | undefined }) {
  const [open, setOpen] = useState(false)
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [payload, setPayload] = useState<DailyDefiNewsResponse | null>(null)

  const storageKey = useMemo(() => {
    const normalizedMemberId = memberId?.trim().toLowerCase() || 'member'
    return `iron-vault:defi-news:${normalizedMemberId}:${getTodayKey()}`
  }, [memberId])

  const loadNews = async () => {
    setLoadState('loading')
    try {
      const response = await fetch('/api/crypto-news/daily', {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!response.ok) throw new Error('Unable to load news')
      const data = (await response.json()) as DailyDefiNewsResponse
      setPayload(data)
      setLoadState('ready')
    } catch {
      setLoadState('error')
    }
  }

  useEffect(() => {
    if (!memberId) return

    const hasSeenToday = window.localStorage.getItem(storageKey) === 'seen'
    if (hasSeenToday) return

    setOpen(true)
    void loadNews()
  }, [memberId, storageKey])

  const closeModal = () => {
    window.localStorage.setItem(storageKey, 'seen')
    setOpen(false)
  }

  if (!open) return null

  const items = payload?.items ?? []

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/78 px-4 py-4 backdrop-blur-sm sm:items-center sm:py-8">
      <div className="iv-panel iv-panel-lime w-full max-w-3xl shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between gap-4 border-b border-[#1a1a1a] p-5 sm:p-6">
          <div className="min-w-0">
            <p className="iv-label mb-2 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              Daily DeFi Brief
            </p>
            <h2 className="iv-title text-3xl sm:text-4xl">Crypto Momentum Watch</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              A constructive scan of today&apos;s DeFi and digital asset headlines for Iron Vault members.
            </p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border border-[#242424] text-zinc-300 transition hover:border-[#aaff00]/50 hover:text-[#aaff00]"
            aria-label="Close daily DeFi brief"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {loadState === 'loading' ? (
            <div className="flex min-h-64 items-center justify-center text-sm text-zinc-400">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin text-[#aaff00]" />
              Loading today&apos;s DeFi headlines
            </div>
          ) : null}

          {loadState === 'error' ? (
            <div className="min-h-64 rounded border border-[#242424] bg-[#080808] p-5 text-center">
              <Newspaper className="mx-auto mb-4 h-8 w-8 text-zinc-500" />
              <h3 className="iv-card-title mb-2 text-2xl">News feed unavailable</h3>
              <p className="mx-auto mb-5 max-w-md text-sm leading-6 text-zinc-400">
                The daily feed could not be reached right now. You can retry, or continue into the portal.
              </p>
              <button type="button" onClick={() => void loadNews()} className="iv-button px-5 py-2 text-sm">
                Retry
              </button>
            </div>
          ) : null}

          {loadState === 'ready' && items.length === 0 ? (
            <div className="min-h-64 rounded border border-[#242424] bg-[#080808] p-5 text-center">
              <Newspaper className="mx-auto mb-4 h-8 w-8 text-zinc-500" />
              <h3 className="iv-card-title mb-2 text-2xl">No DeFi headlines matched yet</h3>
              <p className="mx-auto max-w-md text-sm leading-6 text-zinc-400">
                The source scan ran, but there were no strong DeFi matches. Check back later today.
              </p>
            </div>
          ) : null}

          {loadState === 'ready' && items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item) => (
                <a
                  key={item.url}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded border border-[#1f1f1f] bg-[#080808] p-4 transition hover:border-[#aaff00]/40 hover:bg-[#0c0c0c]"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                    <span className="iv-chip-lime rounded px-2 py-0.5 font-mono">{item.source}</span>
                    <span>{formatDate(item.publishedAt)}</span>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                  <h3 className="text-base font-semibold leading-6 text-zinc-100">{item.title}</h3>
                  {item.summary ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">{item.summary}</p>
                  ) : null}
                  <p className="mt-3 border-l border-[#aaff00]/35 pl-3 text-sm leading-6 text-[#c8ff66]">
                    {item.positiveLens}
                  </p>
                </a>
              ))}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 border-t border-[#1a1a1a] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-zinc-500">
              Sources include The Defiant, Cointelegraph DeFi, CoinDesk, and Decrypt. Headlines link to the original publishers.
            </p>
            <button type="button" onClick={closeModal} className="iv-button shrink-0 px-5 py-2 text-sm">
              Enter Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
