import { NextRequest } from 'next/server'
import { PrivyClient } from '@privy-io/server-auth'

export const PRIVY_ACCESS_TOKEN_COOKIE_NAMES = ['privy-token', 'privy-id-token'] as const

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

function getBearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization')
  if (!header || !header.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length).trim()
  return token.length > 0 ? token : null
}

function getCookieToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null

  const cookieMap = new Map<string, string>()
  for (const part of cookieHeader.split(';')) {
    const [rawName, ...rest] = part.trim().split('=')
    if (!rawName || rest.length === 0) continue
    cookieMap.set(rawName, rest.join('='))
  }

  for (const cookieName of PRIVY_ACCESS_TOKEN_COOKIE_NAMES) {
    const rawValue = cookieMap.get(cookieName)
    if (!rawValue) continue

    const token = rawValue.trim()
    if (token.length > 0) return decodeURIComponent(token)
  }

  return null
}

export function getPrivyAccessTokenFromHeaders(headers: Pick<Headers, 'get'>): string | null {
  const authorization = headers.get('authorization')
  if (authorization?.startsWith('Bearer ')) {
    const token = authorization.slice('Bearer '.length).trim()
    if (token.length > 0) return token
  }

  return getCookieToken(headers.get('cookie'))
}

async function getPrivyUser(accessToken: string) {
  const client = new PrivyClient(requireEnv('NEXT_PUBLIC_PRIVY_APP_ID'), requireEnv('PRIVY_APP_SECRET'))
  let claims: Awaited<ReturnType<PrivyClient['verifyAuthToken']>>
  try {
    claims = await client.verifyAuthToken(accessToken)
  } catch {
    throw new Error('Unauthorized: invalid bearer token')
  }
  const user = await client.getUser(claims.userId)
  return { claims, user }
}

function extractEmail(user: unknown): string | null {
  if (!user || typeof user !== 'object') return null
  const maybeUser = user as {
    email?: { address?: string }
    linkedAccounts?: Array<{ type?: string; address?: string; email?: string }>
    linked_accounts?: Array<{ type?: string; address?: string; email?: string }>
  }
  if (typeof maybeUser.email?.address === 'string') return maybeUser.email.address
  const linked = maybeUser.linkedAccounts ?? maybeUser.linked_accounts ?? []
  for (const account of linked) {
    if (account?.type === 'email' && typeof account.address === 'string') return account.address
    if (account?.type === 'email' && typeof account.email === 'string') return account.email
  }
  return null
}

function extractWalletAddress(user: unknown): string | null {
  if (!user || typeof user !== 'object') return null
  const maybeUser = user as {
    wallet?: { address?: string }
    linkedAccounts?: Array<{ type?: string; address?: string }>
    linked_accounts?: Array<{ type?: string; address?: string }>
  }
  if (typeof maybeUser.wallet?.address === 'string') return maybeUser.wallet.address
  const linked = maybeUser.linkedAccounts ?? maybeUser.linked_accounts ?? []
  for (const account of linked) {
    if ((account?.type === 'wallet' || account?.type === 'smart_wallet') && typeof account.address === 'string') return account.address
  }
  return null
}

export type AuthenticatedPrivyUser = {
  privyUserId: string
  email: string | null
  walletAddress: string | null
}

export async function requirePrivyUserFromAccessToken(accessToken: string): Promise<AuthenticatedPrivyUser> {
  const { claims, user } = await getPrivyUser(accessToken)

  return {
    privyUserId: claims.userId,
    email: extractEmail(user),
    walletAddress: extractWalletAddress(user),
  }
}

export async function requirePrivyUser(req: NextRequest): Promise<AuthenticatedPrivyUser> {
  const token = getBearerToken(req) ?? getPrivyAccessTokenFromHeaders(req.headers)
  if (!token) throw new Error('Unauthorized: missing bearer token')
  return requirePrivyUserFromAccessToken(token)
}
