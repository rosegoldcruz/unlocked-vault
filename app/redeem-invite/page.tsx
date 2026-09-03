'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'

type RedeemState =
  | { type: 'idle'; message: string }
  | { type: 'loading'; message: string }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string }

export default function RedeemInvitePage() {
  const router = useRouter()
  const { ready, authenticated, login, getAccessToken } = usePrivy()
  const [inviteCode, setInviteCode] = useState('')
  const [state, setState] = useState<RedeemState>({ type: 'idle', message: '' })

  useEffect(() => {
    if (ready && !authenticated) {
      login()
    }
  }, [authenticated, login, ready])

  const canSubmit = useMemo(() => {
    return ready && authenticated && inviteCode.trim().length > 0 && state.type !== 'loading'
  }, [authenticated, inviteCode, ready, state.type])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSubmit) return

    setState({ type: 'loading', message: 'Redeeming invite...' })

    try {
      const token = await getAccessToken()
      if (!token) {
        setState({ type: 'error', message: 'You must be signed in before redeeming an invite.' })
        return
      }

      const response = await fetch('/api/access/redeem-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode }),
      })

      const payload = (await response.json().catch(() => null)) as { error?: string; message?: string; status?: string } | null

      if (response.ok) {
        const message = payload?.message ?? 'Invite redeemed successfully.'
        setState({ type: 'success', message })
        router.replace('/dashboard')
        router.refresh()
        return
      }

      setState({
        type: 'error',
        message: payload?.error ?? payload?.message ?? 'Unable to redeem invite. Please try again.',
      })
    } catch {
      setState({ type: 'error', message: 'Unable to redeem invite. Please try again.' })
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] text-zinc-100 grid place-items-center px-6">
      <div className="iv-panel w-full max-w-md p-8">
        <p className="iv-label mb-3">Iron Vault</p>
        <h1 className="iv-title text-4xl">Redeem Invite</h1>
        <p className="iv-body mt-3 text-sm">
          Enter the invite code issued to you. Redemption is tied to your current signed-in account.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="iv-label-muted mb-2 block">Invite Code</span>
            <input
              type="text"
              autoComplete="off"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
              className="iv-field w-full px-3 py-2.5 text-sm"
              placeholder="ENTER-CODE"
              disabled={state.type === 'loading'}
            />
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="iv-button inline-flex w-full items-center justify-center px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state.type === 'loading' ? 'Redeeming...' : 'Redeem Invite'}
          </button>
        </form>

        {state.message ? (
          <p
            className={`mt-4 text-sm ${state.type === 'error' ? 'text-rose-300' : state.type === 'success' ? 'text-lime-300' : 'text-zinc-400'}`}
          >
            {state.message}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/access-required"
            className="iv-button-ghost inline-flex items-center justify-center px-5 py-2.5 text-xs"
          >
            Back
          </Link>
          <Link
            href="https://ironvaulttoken.com/learn"
            className="iv-button-ghost inline-flex items-center justify-center px-5 py-2.5 text-xs"
          >
            Learn Page
          </Link>
        </div>
      </div>
    </main>
  )
}
