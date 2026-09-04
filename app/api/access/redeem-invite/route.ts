import { NextRequest, NextResponse } from 'next/server'
import { auth as clerkAuth, currentUser } from '@clerk/nextjs/server'
import { requireIronVaultUser } from '@/lib/server/clerk-auth'
import { getSupabaseAdmin } from '@/lib/server/supabase-admin'
import { resolveCanonicalAccess } from '@/lib/server/access-model'

type InviteStatus = 'active' | 'used' | 'revoked' | 'expired'

type MemberInvite = {
  id: string
  invite_code: string
  email: string | null
  wallet_address: string | null
  status: InviteStatus
  max_uses: number
  used_count: number
  created_by: string | null
  expires_at: string | null
  metadata: Record<string, unknown>
}

type MemberEntitlement = {
  id: string
  status: 'active' | 'revoked' | 'expired'
  metadata?: Record<string, unknown> | null
  package?: string | null
  core_academy_access?: string | null
  developer_lab_access?: boolean | null
}

type RedeemIdentity = {
  clerkUserId: string
  privyUserId: string
  email: string | null
  walletAddress: string | null
}

const MASTER_INVITE_CODE = (process.env.IRON_VAULT_MASTER_INVITE_CODE ?? '').trim().toUpperCase()
const MASTER_INVITE_ACCESS = {
  package: 'INTERMEDIATE',
  coreAcademyAccess: 'FULL',
  developerLabAccess: false,
} as const

function normalizeInviteCode(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toUpperCase()
  return normalized.length > 0 ? normalized : null
}

function isMasterInviteCode(code: string): boolean {
  if (!MASTER_INVITE_CODE) return false
  return code === MASTER_INVITE_CODE
}

function isUnauthorized(message: string): boolean {
  return message.startsWith('Unauthorized:')
}

function normalizeNullable(value: string | null): string | null {
  if (!value) return null
  return value.trim().toLowerCase()
}

function normalizeOptional(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : null
}

function normalizeWalletAddress(value: string | null | undefined): string | null {
  const normalized = normalizeOptional(value)
  if (!normalized) return null
  return normalized.startsWith('0x') ? normalized.toLowerCase() : normalized
}

function isInviteExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  const expiresAtMs = Date.parse(expiresAt)
  if (Number.isNaN(expiresAtMs)) return false
  return expiresAtMs <= Date.now()
}

function inviteMatchesIdentity(invite: MemberInvite, email: string | null, walletAddress: string | null): boolean {
  const inviteEmail = normalizeNullable(invite.email)
  const inviteWallet = normalizeNullable(invite.wallet_address)
  const userEmail = normalizeNullable(email)
  const userWallet = normalizeNullable(walletAddress)

  if (inviteEmail && inviteEmail !== userEmail) return false
  if (inviteWallet && inviteWallet !== userWallet) return false
  return true
}

async function findActiveEntitlementForIdentity(
  column: 'privy_user_id' | 'email' | 'wallet_address',
  value: string,
): Promise<MemberEntitlement | null> {
  const nowIso = new Date().toISOString()
  const { data, error } = await getSupabaseAdmin()
    .from('iv_member_entitlements')
    .select('id,status,metadata,package,core_academy_access,developer_lab_access')
    .eq(column, value)
    .eq('status', 'active')
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order('granted_at', { ascending: false })
    .limit(1)

  if (error) throw error
  if (!data || data.length === 0) return null
  return data[0] as MemberEntitlement
}

async function findExistingInviteEntitlement(
  inviteCode: string,
  identity: { privyUserId: string; email: string | null; walletAddress: string | null },
): Promise<MemberEntitlement | null> {
  const { data: byPrivyUserId, error: byPrivyUserIdError } = await getSupabaseAdmin()
    .from('iv_member_entitlements')
    .select('id,status')
    .eq('invite_code', inviteCode)
    .eq('privy_user_id', identity.privyUserId)
    .order('granted_at', { ascending: false })
    .limit(1)

  if (byPrivyUserIdError) throw byPrivyUserIdError
  if (byPrivyUserId?.[0]) return byPrivyUserId[0] as MemberEntitlement

  if (identity.email) {
    const { data: byEmail, error: byEmailError } = await getSupabaseAdmin()
      .from('iv_member_entitlements')
      .select('id,status')
      .eq('invite_code', inviteCode)
      .eq('email', identity.email)
      .order('granted_at', { ascending: false })
      .limit(1)

    if (byEmailError) throw byEmailError
    if (byEmail?.[0]) return byEmail[0] as MemberEntitlement
  }

  if (identity.walletAddress) {
    const { data: byWalletAddress, error: byWalletAddressError } = await getSupabaseAdmin()
      .from('iv_member_entitlements')
      .select('id,status')
      .eq('invite_code', inviteCode)
      .eq('wallet_address', identity.walletAddress)
      .order('granted_at', { ascending: false })
      .limit(1)

    if (byWalletAddressError) throw byWalletAddressError
    if (byWalletAddress?.[0]) return byWalletAddress[0] as MemberEntitlement
  }

  return null
}

async function resolveMasterInviteIdentity(): Promise<RedeemIdentity> {
  const { userId } = await clerkAuth()
  if (!userId) throw new Error('Unauthorized: missing Clerk session')

  const user = await currentUser()
  if (!user) throw new Error('Unauthorized: missing Clerk user')

  const primaryEmail = user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)
  const email = normalizeNullable(primaryEmail?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null)
  const primaryWallet = user.web3Wallets.find((wallet) => wallet.id === user.primaryWeb3WalletId)
  const walletAddress = normalizeWalletAddress(primaryWallet?.web3Wallet ?? user.web3Wallets[0]?.web3Wallet ?? null)

  const { data: existingLink, error: existingLinkError } = await getSupabaseAdmin()
    .from('iv_auth_identity_links')
    .select('privy_user_id')
    .eq('clerk_user_id', userId)
    .maybeSingle<{ privy_user_id: string }>()

  if (existingLinkError) throw existingLinkError

  const privyUserId = existingLink?.privy_user_id ?? userId

  const { error: linkError } = await getSupabaseAdmin()
    .from('iv_auth_identity_links')
    .upsert(
      {
        clerk_user_id: userId,
        privy_user_id: privyUserId,
        email,
        wallet_address: walletAddress,
        link_strategy: existingLink ? 'existing_link' : 'new_clerk_user',
        metadata: { source: 'master_invite_runtime_resolver' },
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'clerk_user_id' },
    )

  if (linkError) throw linkError

  return { clerkUserId: userId, privyUserId, email, walletAddress }
}

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[academy-access] validation route hit', { hasConfiguredCode: Boolean(process.env.IRON_VAULT_MASTER_INVITE_CODE) })
    }

    const body = await req.json().catch(() => null)
    const inviteCode = normalizeInviteCode(body?.inviteCode)

    if (!inviteCode) {
      return NextResponse.json({ error: 'Missing required field: inviteCode' }, { status: 400 })
    }

    const auth = isMasterInviteCode(inviteCode)
      ? await resolveMasterInviteIdentity()
      : await requireIronVaultUser(req)

    const activeEntitlementChecks: Array<Promise<MemberEntitlement | null>> = [
      findActiveEntitlementForIdentity('privy_user_id', auth.privyUserId),
    ]

    if (auth.email) {
      activeEntitlementChecks.push(findActiveEntitlementForIdentity('email', auth.email))
    }

    if (auth.walletAddress) {
      activeEntitlementChecks.push(findActiveEntitlementForIdentity('wallet_address', auth.walletAddress))
    }

    for (const check of activeEntitlementChecks) {
      const entitlement = await check
      if (entitlement && resolveCanonicalAccess({
        package: entitlement.package,
        core_academy_access: entitlement.core_academy_access,
        developer_lab_access: entitlement.developer_lab_access,
        ...(entitlement.metadata ?? {}),
      }).coreAcademyAccess === 'FULL') {
        return NextResponse.json(
          {
            status: 'already_unlocked',
            message: 'Your account already has member access.',
          },
          { status: 200 },
        )
      }
    }

    // Master invite code: reusable admin-controlled code that always works.
    // Enabled only when IRON_VAULT_MASTER_INVITE_CODE is set in the environment.
    if (isMasterInviteCode(inviteCode)) {
      const existingMasterEntitlement = await findExistingInviteEntitlement(inviteCode, {
        privyUserId: auth.privyUserId,
        email: auth.email,
        walletAddress: auth.walletAddress,
      })

      if (existingMasterEntitlement) {
        const { error: updateMasterEntitlementError } = await getSupabaseAdmin()
          .from('iv_member_entitlements')
          .update({
            source: 'admin',
            status: 'active',
            granted_by: 'master_invite_code',
            metadata: {
              ...(existingMasterEntitlement.metadata ?? {}),
              redeemed_via: 'member_portal',
              master_invite: true,
              package: MASTER_INVITE_ACCESS.package,
              core_academy_access: MASTER_INVITE_ACCESS.coreAcademyAccess,
              developer_lab_access: MASTER_INVITE_ACCESS.developerLabAccess,
            },
            package: MASTER_INVITE_ACCESS.package,
            core_academy_access: MASTER_INVITE_ACCESS.coreAcademyAccess,
            developer_lab_access: MASTER_INVITE_ACCESS.developerLabAccess,
          })
          .eq('id', existingMasterEntitlement.id)

        if (updateMasterEntitlementError) throw updateMasterEntitlementError

        return NextResponse.json(
          {
            status: 'redeemed',
            message: 'Invite redeemed successfully. Redirecting to your dashboard.',
          },
          { status: 200 },
        )
      }

      const { error: masterEntitlementError } = await getSupabaseAdmin()
        .from('iv_member_entitlements')
        .insert({
          privy_user_id: auth.privyUserId,
          email: auth.email,
          wallet_address: auth.walletAddress,
          source: 'admin',
          status: 'active',
          invite_code: inviteCode,
          granted_by: 'master_invite_code',
          metadata: {
            redeemed_via: 'member_portal',
            master_invite: true,
            package: MASTER_INVITE_ACCESS.package,
            core_academy_access: MASTER_INVITE_ACCESS.coreAcademyAccess,
            developer_lab_access: MASTER_INVITE_ACCESS.developerLabAccess,
          },
          package: MASTER_INVITE_ACCESS.package,
          core_academy_access: MASTER_INVITE_ACCESS.coreAcademyAccess,
          developer_lab_access: MASTER_INVITE_ACCESS.developerLabAccess,
        })
        .select('id')
        .single<{ id: string }>()

      if (masterEntitlementError) throw masterEntitlementError

      return NextResponse.json(
        {
          status: 'redeemed',
          message: 'Invite redeemed successfully. Redirecting to your dashboard.',
        },
        { status: 201 },
      )
    }

    const existingInviteEntitlement = await findExistingInviteEntitlement(inviteCode, {
      privyUserId: auth.privyUserId,
      email: auth.email,
      walletAddress: auth.walletAddress,
    })

    if (existingInviteEntitlement) {
      return NextResponse.json(
        {
          status: 'already_redeemed',
          message: 'This invite has already been redeemed for your account.',
        },
        { status: 200 },
      )
    }

    const { data: invite, error: inviteError } = await getSupabaseAdmin()
      .from('iv_member_invites')
      .select('*')
      .eq('invite_code', inviteCode)
      .maybeSingle<MemberInvite>()

    if (inviteError) throw inviteError
    if (!invite) {
      return NextResponse.json({ error: 'Invalid invite code.' }, { status: 404 })
    }

    if (invite.status !== 'active') {
      return NextResponse.json({ error: 'Invite code is not active.' }, { status: 409 })
    }

    if (isInviteExpired(invite.expires_at)) {
      return NextResponse.json({ error: 'Invite code is expired.' }, { status: 409 })
    }

    if (invite.used_count >= invite.max_uses) {
      return NextResponse.json({ error: 'Invite code has reached its usage limit.' }, { status: 409 })
    }

    if (!inviteMatchesIdentity(invite, auth.email, auth.walletAddress)) {
      return NextResponse.json({ error: 'Invite code does not match this account.' }, { status: 403 })
    }

    const { data: entitlement, error: entitlementError } = await getSupabaseAdmin()
      .from('iv_member_entitlements')
      .insert({
        privy_user_id: auth.privyUserId,
        email: auth.email,
        wallet_address: auth.walletAddress,
        source: 'invite',
        status: 'active',
        invite_code: inviteCode,
        granted_by: invite.created_by,
        metadata: {
          invite_id: invite.id,
          redeemed_via: 'member_portal',
          ...invite.metadata,
        },
        package: resolveCanonicalAccess(invite.metadata).package,
        core_academy_access: resolveCanonicalAccess(invite.metadata).coreAcademyAccess,
        developer_lab_access: resolveCanonicalAccess(invite.metadata).developerLabAccess,
      })
      .select('id')
      .single<{ id: string }>()

    if (entitlementError) throw entitlementError

    const nextUsedCount = invite.used_count + 1
    const nextStatus: InviteStatus = nextUsedCount >= invite.max_uses ? 'used' : 'active'

    const { data: updatedInvite, error: updateInviteError } = await getSupabaseAdmin()
      .from('iv_member_invites')
      .update({
        used_count: nextUsedCount,
        status: nextStatus,
      })
      .eq('id', invite.id)
      .eq('used_count', invite.used_count)
      .select('id')
      .maybeSingle<{ id: string }>()

    if (updateInviteError || !updatedInvite) {
      await getSupabaseAdmin().from('iv_member_entitlements').delete().eq('id', entitlement.id)
      return NextResponse.json({ error: 'Invite code is no longer available.' }, { status: 409 })
    }

    return NextResponse.json(
      {
        status: 'redeemed',
        message: 'Invite redeemed successfully. Redirecting to your dashboard.',
      },
      { status: 201 },
    )
  } catch (error: unknown) {
    console.error('[academy-access] redeem invite failed', error)
    const message = error instanceof Error ? error.message : 'Failed to redeem invite'
    const status = isUnauthorized(message) ? 401 : 500
    return NextResponse.json({ error: status === 401 ? message : 'Failed to redeem invite' }, { status })
  }
}
