import { createHash } from 'node:crypto'
import { getSupabaseAdmin } from '@/lib/server/supabase-admin'

type UserRole = 'MEMBER' | 'VIP' | 'ADMIN'

const VIP_TIERS = new Set(['BUILDER', 'FOUNDER', 'BUILDER_ACCELERATOR', 'FOUNDER_ELITE'])

function tierToRole(tier: string | null | undefined): UserRole {
  if (!tier) return 'MEMBER'
  if (VIP_TIERS.has(tier)) return 'VIP'
  return 'MEMBER'
}

function buildReferralCode(privyUserId: string, attempt: number) {
  const digest = createHash('sha1').update(`iv-ref:${privyUserId}:${attempt}`).digest('hex').slice(0, 10)
  return `IV${digest.toUpperCase()}`
}

export type BackofficeProfile = {
  id: string
  privy_user_id: string
  email: string | null
  role: UserRole
  current_tier: string | null
  referral_code: string
  referred_by_privy_user_id: string | null
  vault_xp: number
  wallet_address: string | null
  created_at: string
  updated_at: string
}

export async function ensureUserProfile(
  privyUserId: string,
  params?: { email?: string | null; walletAddress?: string | null; tier?: string | null }
): Promise<BackofficeProfile> {
  const supabase = getSupabaseAdmin()

  const { data: existing } = await supabase
    .from('iv_user_profiles')
    .select('*')
    .eq('privy_user_id', privyUserId)
    .maybeSingle<BackofficeProfile>()

  if (existing?.referral_code) {
    const patch: Partial<BackofficeProfile> = {}
    if (typeof params?.email === 'string' && params.email && params.email !== existing.email) patch.email = params.email
    if (typeof params?.walletAddress === 'string' && params.walletAddress && params.walletAddress !== existing.wallet_address) patch.wallet_address = params.walletAddress
    if (params?.tier && params.tier !== existing.current_tier) { patch.current_tier = params.tier; patch.role = tierToRole(params.tier) }
    if (Object.keys(patch).length === 0) return existing
    const { data, error } = await supabase.from('iv_user_profiles').update(patch).eq('privy_user_id', privyUserId).select('*').single<BackofficeProfile>()
    if (error) throw error
    return data
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const referralCode = buildReferralCode(privyUserId, attempt)
    const role = params?.tier ? tierToRole(params.tier) : 'MEMBER'
    const payload = {
      privy_user_id: privyUserId,
      email: params?.email ?? existing?.email ?? null,
      role,
      current_tier: params?.tier ?? existing?.current_tier ?? null,
      referral_code: referralCode,
      wallet_address: params?.walletAddress ?? existing?.wallet_address ?? null,
    }
    const { data, error } = await supabase.from('iv_user_profiles').upsert(payload, { onConflict: 'privy_user_id' }).select('*').single<BackofficeProfile>()
    if (!error && data) return data
    if (error?.code !== '23505') throw error
  }

  throw new Error('Failed to generate unique referral code')
}
