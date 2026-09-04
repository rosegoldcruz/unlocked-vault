import { auth, currentUser, type User } from '@clerk/nextjs/server'
import { getSupabaseAdmin } from '@/lib/server/supabase-admin'

type IdentityLinkStrategy =
  | 'existing_link'
  | 'trusted_clerk_legacy_id'
  | 'verified_email'
  | 'verified_wallet'
  | 'verified_identity'
  | 'new_clerk_user'
  | 'webhook'

type IdentityLinkRow = {
  clerk_user_id: string
  privy_user_id: string
  email: string | null
  wallet_address: string | null
  link_strategy: IdentityLinkStrategy
}

type LegacyIdRow = {
  privy_user_id: string | null
}

type LegacyCandidate = {
  privyUserId: string
  strategy: 'trusted_clerk_legacy_id' | 'verified_email' | 'verified_wallet'
}

export type AuthenticatedIronVaultUser = {
  clerkUserId: string
  privyUserId: string
  email: string | null
  walletAddress: string | null
}

function normalizeOptional(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : null
}

function normalizeEmail(value: string | null | undefined): string | null {
  return normalizeOptional(value)?.toLowerCase() ?? null
}

function normalizeWalletAddress(value: string | null | undefined): string | null {
  const normalized = normalizeOptional(value)
  if (!normalized) return null
  return normalized.startsWith('0x') ? normalized.toLowerCase() : normalized
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map(normalizeOptional).filter((value): value is string => Boolean(value)))]
}

function emailMatchValues(value: string | null | undefined): string[] {
  return uniqueStrings([value, normalizeEmail(value)])
}

function getVerifiedEmails(user: User): string[] {
  return uniqueStrings(
    user.emailAddresses
      .filter((email) => email.verification?.status === 'verified')
      .flatMap((email) => emailMatchValues(email.emailAddress)),
  )
}

function getPrimaryVerifiedEmail(user: User): string | null {
  const primaryEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId && email.verification?.status === 'verified',
  )
  return normalizeEmail(primaryEmail?.emailAddress) ?? getVerifiedEmails(user)[0] ?? null
}

function getVerifiedWallets(user: User): string[] {
  return uniqueStrings(
    user.web3Wallets
      .filter((wallet) => wallet.verification?.status === 'verified')
      .map((wallet) => normalizeWalletAddress(wallet.web3Wallet)),
  )
}

function getPrimaryVerifiedWallet(user: User): string | null {
  const primaryWallet = user.web3Wallets.find(
    (wallet) => wallet.id === user.primaryWeb3WalletId && wallet.verification?.status === 'verified',
  )
  return normalizeWalletAddress(primaryWallet?.web3Wallet) ?? getVerifiedWallets(user)[0] ?? null
}

function getTrustedLegacyIds(user: User): string[] {
  const metadata = user.privateMetadata as Record<string, unknown>
  return uniqueStrings([
    user.externalId,
    typeof metadata.privyUserId === 'string' ? metadata.privyUserId : null,
    typeof metadata.legacyPrivyUserId === 'string' ? metadata.legacyPrivyUserId : null,
    typeof metadata.legacyUserId === 'string' ? metadata.legacyUserId : null,
  ])
}

async function findExistingIdentityLink(clerkUserId: string): Promise<IdentityLinkRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('iv_auth_identity_links')
    .select('clerk_user_id, privy_user_id, email, wallet_address, link_strategy')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle<IdentityLinkRow>()

  if (error) throw error
  return data ?? null
}

async function legacyIdExists(privyUserId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  const { data: profile, error: profileError } = await supabase
    .from('iv_user_profiles')
    .select('privy_user_id')
    .eq('privy_user_id', privyUserId)
    .maybeSingle<LegacyIdRow>()

  if (profileError) throw profileError
  if (profile?.privy_user_id) return true

  const { data: entitlement, error: entitlementError } = await supabase
    .from('iv_member_entitlements')
    .select('privy_user_id')
    .eq('privy_user_id', privyUserId)
    .limit(1)

  if (entitlementError) throw entitlementError
  return Boolean((entitlement as LegacyIdRow[] | null)?.[0]?.privy_user_id)
}

async function findCandidatesByColumn(
  table: 'iv_user_profiles' | 'iv_member_entitlements',
  column: 'email' | 'wallet_address',
  values: string[],
  strategy: 'verified_email' | 'verified_wallet',
): Promise<LegacyCandidate[]> {
  const candidates: LegacyCandidate[] = []
  for (const value of values) {
    const { data, error } = await getSupabaseAdmin().from(table).select('privy_user_id').eq(column, value)
    if (error) throw error

    for (const row of (data ?? []) as LegacyIdRow[]) {
      const privyUserId = normalizeOptional(row.privy_user_id)
      if (privyUserId) candidates.push({ privyUserId, strategy })
    }
  }

  return candidates
}

async function findLegacyCandidates(user: User, emails: string[], wallets: string[]): Promise<LegacyCandidate[]> {
  const trustedIds = getTrustedLegacyIds(user)
  const trustedCandidates: LegacyCandidate[] = []
  for (const trustedId of trustedIds) {
    if (await legacyIdExists(trustedId)) {
      trustedCandidates.push({ privyUserId: trustedId, strategy: 'trusted_clerk_legacy_id' })
    }
  }

  const [profileEmail, entitlementEmail, profileWallet, entitlementWallet] = await Promise.all([
    findCandidatesByColumn('iv_user_profiles', 'email', emails, 'verified_email'),
    findCandidatesByColumn('iv_member_entitlements', 'email', emails, 'verified_email'),
    findCandidatesByColumn('iv_user_profiles', 'wallet_address', wallets, 'verified_wallet'),
    findCandidatesByColumn('iv_member_entitlements', 'wallet_address', wallets, 'verified_wallet'),
  ])

  return [...trustedCandidates, ...profileEmail, ...entitlementEmail, ...profileWallet, ...entitlementWallet]
}

function resolveCandidate(candidates: LegacyCandidate[]): { privyUserId: string; strategy: IdentityLinkStrategy } | null {
  const uniqueIds = [...new Set(candidates.map((candidate) => candidate.privyUserId))]
  if (uniqueIds.length === 0) return null
  if (uniqueIds.length > 1) {
    throw new Error('Forbidden: multiple legacy accounts match this verified Clerk identity')
  }

  const matched = candidates.find((candidate) => candidate.privyUserId === uniqueIds[0])
  if (!matched) return null

  const strategies = new Set(candidates.map((candidate) => candidate.strategy))
  const strategy =
    strategies.has('trusted_clerk_legacy_id')
      ? 'trusted_clerk_legacy_id'
      : strategies.size > 1
        ? 'verified_identity'
        : matched.strategy

  return { privyUserId: matched.privyUserId, strategy }
}

async function upsertIdentityLink(params: {
  clerkUserId: string
  privyUserId: string
  email: string | null
  walletAddress: string | null
  strategy: IdentityLinkStrategy
}) {
  const { error } = await getSupabaseAdmin()
    .from('iv_auth_identity_links')
    .upsert(
      {
        clerk_user_id: params.clerkUserId,
        privy_user_id: params.privyUserId,
        email: params.email,
        wallet_address: params.walletAddress,
        link_strategy: params.strategy,
        metadata: { source: 'clerk_runtime_resolver' },
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'clerk_user_id' },
    )

  if (error) throw error
}

async function resolveLegacyPrivyUserId(user: User): Promise<AuthenticatedIronVaultUser> {
  const clerkUserId = user.id
  const verifiedEmails = getVerifiedEmails(user)
  const verifiedWallets = getVerifiedWallets(user)
  const email = getPrimaryVerifiedEmail(user)
  const walletAddress = getPrimaryVerifiedWallet(user)

  const existingLink = await findExistingIdentityLink(clerkUserId)
  if (existingLink) {
    await upsertIdentityLink({
      clerkUserId,
      privyUserId: existingLink.privy_user_id,
      email,
      walletAddress,
      strategy: 'existing_link',
    })
    return { clerkUserId, privyUserId: existingLink.privy_user_id, email, walletAddress }
  }

  const candidate = resolveCandidate(await findLegacyCandidates(user, verifiedEmails, verifiedWallets))
  const privyUserId = candidate?.privyUserId ?? clerkUserId
  const strategy = candidate?.strategy ?? 'new_clerk_user'

  await upsertIdentityLink({ clerkUserId, privyUserId, email, walletAddress, strategy })
  return { clerkUserId, privyUserId, email, walletAddress }
}

export async function getOptionalIronVaultUser(_request?: Request): Promise<AuthenticatedIronVaultUser | null> {
  void _request
  const { userId } = await auth()
  if (!userId) return null

  const user = await currentUser()
  if (!user) throw new Error('Unauthorized: missing Clerk user')
  return resolveLegacyPrivyUserId(user)
}

export async function requireIronVaultUser(_request?: Request): Promise<AuthenticatedIronVaultUser> {
  void _request
  const user = await getOptionalIronVaultUser()
  if (!user) throw new Error('Unauthorized: missing Clerk session')
  return user
}
