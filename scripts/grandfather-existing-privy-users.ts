import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

type Mode = 'dry-run' | 'apply'
type UserRole = 'MEMBER' | 'VIP' | 'ADMIN'

type UserProfile = {
  id: string
  privy_user_id: string
  email: string | null
  wallet_address: string | null
  role: UserRole
  created_at: string
}

type MemberEntitlement = {
  id: string
  source: 'stripe' | 'invite' | 'grandfathered' | 'admin'
  status: 'active' | 'revoked' | 'expired'
}

type Summary = {
  cutoff: string
  usersFound: number
  alreadyEntitled: number
  newlyGrandfathered: number
  skipped: number
  errors: number
}

class DisabledRealtimeWebSocket {
  constructor() {
    throw new Error('Realtime is disabled for this script')
  }
}

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const equalsIndex = trimmed.indexOf('=')
    if (equalsIndex <= 0) continue

    const name = trimmed.slice(0, equalsIndex).trim()
    let value = trimmed.slice(equalsIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    if (!process.env[name]) process.env[name] = value
  }
}

function parseMode(): Mode {
  const hasDryRun = process.argv.includes('--dry-run')
  const hasApply = process.argv.includes('--apply')

  if (hasDryRun === hasApply) {
    throw new Error('Pass exactly one mode: --dry-run or --apply')
  }

  return hasApply ? 'apply' : 'dry-run'
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

function parseCutoff(): string {
  const value = requireEnv('GRANDFATHER_CUTOFF_ISO')
  const cutoffMs = Date.parse(value)
  if (Number.isNaN(cutoffMs)) {
    throw new Error('GRANDFATHER_CUTOFF_ISO must be a valid ISO timestamp')
  }
  return new Date(cutoffMs).toISOString()
}

function getSupabaseForScript() {
  return createClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: DisabledRealtimeWebSocket as never },
  })
}

function normalize(value: string | null): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed.toLowerCase() : null
}

async function findActiveEntitlement(
  supabase: ReturnType<typeof getSupabaseForScript>,
  profile: UserProfile,
): Promise<MemberEntitlement | null> {
  const nowIso = new Date().toISOString()
  const filters: string[] = [`privy_user_id.eq.${profile.privy_user_id}`]
  const email = normalize(profile.email)
  const walletAddress = normalize(profile.wallet_address)

  if (email) filters.push(`email.eq.${email}`)
  if (walletAddress) filters.push(`wallet_address.eq.${walletAddress}`)

  const { data, error } = await supabase
    .from('iv_member_entitlements')
    .select('id,source,status')
    .eq('status', 'active')
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .or(filters.join(','))
    .order('granted_at', { ascending: false })
    .limit(1)

  if (error) throw error
  return (data?.[0] as MemberEntitlement | undefined) ?? null
}

async function fetchProfiles(
  supabase: ReturnType<typeof getSupabaseForScript>,
  cutoff: string,
): Promise<UserProfile[]> {
  const pageSize = 1000
  const profiles: UserProfile[] = []

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1
    const { data, error } = await supabase
      .from('iv_user_profiles')
      .select('id,privy_user_id,email,wallet_address,role,created_at')
      .lte('created_at', cutoff)
      .order('created_at', { ascending: true })
      .range(from, to)

    if (error) throw error
    if (!data || data.length === 0) break

    profiles.push(...(data as UserProfile[]))
    if (data.length < pageSize) break
  }

  return profiles
}

async function main() {
  loadEnvLocal()

  const mode = parseMode()
  const cutoff = parseCutoff()
  const supabase = getSupabaseForScript()
  const profiles = await fetchProfiles(supabase, cutoff)
  const summary: Summary = {
    cutoff,
    usersFound: profiles.length,
    alreadyEntitled: 0,
    newlyGrandfathered: 0,
    skipped: 0,
    errors: 0,
  }

  for (const profile of profiles) {
    try {
      if (!profile.privy_user_id && !profile.email && !profile.wallet_address) {
        summary.skipped += 1
        continue
      }

      const existingEntitlement = await findActiveEntitlement(supabase, profile)
      if (existingEntitlement) {
        summary.alreadyEntitled += 1
        continue
      }

      if (mode === 'apply') {
        const { error } = await supabase.from('iv_member_entitlements').insert({
          privy_user_id: profile.privy_user_id,
          email: normalize(profile.email),
          wallet_address: normalize(profile.wallet_address),
          source: 'grandfathered',
          status: 'active',
          granted_by: 'system:grandfather-existing-privy-users',
          metadata: {
            reason: 'existing_privy_user_before_payment_gate_lock',
            cutoff,
            script: 'scripts/grandfather-existing-privy-users.ts',
          },
        })

        if (error) throw error
      }

      summary.newlyGrandfathered += 1
    } catch (error) {
      summary.errors += 1
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(`grandfather error: ${message}`)
    }
  }

  console.info(JSON.stringify({ mode, ...summary }, null, 2))
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error'
  console.error(`grandfather failed: ${message}`)
  process.exit(1)
})
