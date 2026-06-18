"use client"

import { FormEvent, type ReactNode, useEffect, useState } from 'react'
import { KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react'

export function VIPGate({ children }: { children: ReactNode }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [configured, setConfigured] = useState(true)
  const [unlocked, setUnlocked] = useState(false)
  const [opening, setOpening] = useState(false)

  useEffect(() => {
    let active = true

    async function checkAccess() {
      try {
        const response = await fetch('/api/vip/access', { cache: 'no-store' })
        const data = await response.json()
        if (!active) return
        setConfigured(Boolean(data.configured))
        setUnlocked(Boolean(data.unlocked))
      } catch {
        if (!active) return
        setError('Unable to verify VIP access right now.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void checkAccess()

    return () => {
      active = false
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const response = await fetch('/api/vip/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setError(data?.error ?? 'VIP access was denied.')
        return
      }

      setOpening(true)
      window.setTimeout(() => {
        setUnlocked(true)
        setOpening(false)
      }, 1550)
    } catch {
      setError('Unable to unlock VIP access right now.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="iv-panel grid min-h-[520px] place-items-center p-8">
        <div className="h-12 w-12 animate-pulse rounded-full border border-[#aaff00]/30 bg-[#aaff00]/10" />
      </div>
    )
  }

  if (unlocked) return <>{children}</>

  return (
    <section className="relative min-h-[calc(100vh-8rem)] overflow-hidden border border-[#1a1a1a] bg-[#050505]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(170,255,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(170,255,0,0.05)_1px,transparent_1px)] bg-[size:44px_44px] opacity-40" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#aaff00] to-transparent" />

      <div className="relative z-10 grid min-h-[calc(100vh-8rem)] place-items-center px-4 py-10">
        <div className={`vip-vault-stage ${opening ? 'vip-vault-stage-open' : ''}`} aria-hidden="true">
          <div className="vip-vault-door vip-vault-door-left">
            <div className="vip-vault-ribs" />
          </div>
          <div className="vip-vault-door vip-vault-door-right">
            <div className="vip-vault-ribs" />
          </div>
          <div className="vip-vault-lock">
            <LockKeyhole className="h-10 w-10 text-[#aaff00]" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className={`relative z-20 w-full max-w-md border border-[#2a2a2a] bg-[#080808]/92 p-6 shadow-[0_0_70px_rgba(170,255,0,0.10)] transition duration-500 sm:p-8 ${opening ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
          <div className="mb-6 text-center">
            <div className="iv-chip-lime mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded">
              <ShieldCheck aria-hidden="true" className="h-7 w-7" />
            </div>
            <p className="iv-label mb-3">Private VIP Portal</p>
            <h1 className="iv-title text-5xl">VAULT ACCESS</h1>
            <p className="iv-body mt-4 text-sm text-zinc-400">
              Enter the current VIP access code to unlock the partner vault.
            </p>
          </div>

          {!configured ? (
            <div className="border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
              VIP access is not configured yet. Set <span className="font-mono">IRON_VAULT_VIP_ACCESS_CODE</span> in the environment.
            </div>
          ) : (
            <>
              <label htmlFor="vip-access-code" className="block">
                <span className="iv-label-muted mb-2 block">Access Code</span>
                <div className="relative">
                  <KeyRound aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#aaff00]" />
                  <input
                    id="vip-access-code"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    className="iv-field min-h-12 w-full pl-11 pr-4 text-sm"
                    type="password"
                    autoComplete="one-time-code"
                    required
                  />
                </div>
              </label>

              {error ? (
                <p className="mt-4 border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>
              ) : null}

              <button type="submit" disabled={submitting || opening} className="iv-button mt-5 inline-flex min-h-12 w-full items-center justify-center px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60">
                {submitting || opening ? 'OPENING VAULT' : 'UNLOCK VIP'}
              </button>
            </>
          )}
        </form>
      </div>

      <style jsx>{`
        .vip-vault-stage {
          position: absolute;
          inset: 0;
          overflow: hidden;
          perspective: 1200px;
        }

        .vip-vault-door {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 50%;
          background:
            radial-gradient(circle at center, rgba(170, 255, 0, 0.12), transparent 28%),
            repeating-linear-gradient(90deg, #111 0 18px, #080808 18px 36px);
          border-color: rgba(170, 255, 0, 0.18);
          box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.9);
          transition: transform 1.45s cubic-bezier(0.77, 0, 0.18, 1), filter 1.45s ease;
        }

        .vip-vault-door-left {
          left: 0;
          transform-origin: left center;
          border-right: 1px solid rgba(170, 255, 0, 0.28);
        }

        .vip-vault-door-right {
          right: 0;
          transform-origin: right center;
          border-left: 1px solid rgba(170, 255, 0, 0.28);
        }

        .vip-vault-stage-open .vip-vault-door-left {
          transform: rotateY(-78deg) translateX(-14%);
          filter: brightness(1.35);
        }

        .vip-vault-stage-open .vip-vault-door-right {
          transform: rotateY(78deg) translateX(14%);
          filter: brightness(1.35);
        }

        .vip-vault-ribs {
          position: absolute;
          inset: 22px;
          border: 1px solid rgba(170, 255, 0, 0.14);
          background: repeating-linear-gradient(0deg, transparent 0 34px, rgba(170, 255, 0, 0.08) 34px 36px);
        }

        .vip-vault-lock {
          position: absolute;
          left: 50%;
          top: 50%;
          display: grid;
          height: 112px;
          width: 112px;
          place-items: center;
          transform: translate(-50%, -50%);
          border: 1px solid rgba(170, 255, 0, 0.35);
          border-radius: 999px;
          background: #070707;
          box-shadow: 0 0 54px rgba(170, 255, 0, 0.18), inset 0 0 32px rgba(0, 0, 0, 0.9);
          transition: transform 1s ease, opacity 0.75s ease;
        }

        .vip-vault-stage-open .vip-vault-lock {
          transform: translate(-50%, -50%) scale(1.4) rotate(18deg);
          opacity: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .vip-vault-door,
          .vip-vault-lock {
            transition: none;
          }
        }
      `}</style>
    </section>
  )
}
