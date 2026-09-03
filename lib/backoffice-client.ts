import type { BackofficeProfile, ReferralLead, StatusTicket, UserPosition } from '@/types/backoffice'

type BackofficeRequestOptions = {
  method?: 'GET' | 'POST'
  body?: unknown
  cache?: RequestCache
}

type BackofficeErrorResponse = {
  error?: string
  message?: string
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const payload = (await res.json()) as BackofficeErrorResponse
    if (typeof payload.error === 'string' && payload.error.length > 0) return payload.error
    if (typeof payload.message === 'string' && payload.message.length > 0) return payload.message
  } catch {
    // ignore
  }
  return res.statusText || 'Backoffice request failed'
}

export async function fetchBackofficeJson<T>(
  path: string,
  accessToken: string,
  options: BackofficeRequestOptions = {},
): Promise<T> {
  const method = options.method ?? 'GET'
  const res = await fetch(path, {
    method,
    cache: options.cache ?? 'no-store',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) throw new Error(await readErrorMessage(res))
  return (await res.json()) as T
}

export type BackofficeProfileResponse = { profile: BackofficeProfile }
export type BackofficeReferralsResponse = { referrals: ReferralLead[] }
export type BackofficeReferralCreateResponse = { referral: ReferralLead }
export type BackofficePositionResponse = { position: UserPosition }
export type BackofficeTicketsResponse = { tickets: StatusTicket[] }
export type BackofficeTicketCreateResponse = { ticket: StatusTicket }
