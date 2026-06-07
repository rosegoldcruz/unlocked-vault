import { cookies, headers } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/server/supabase-admin'
import {
	getPrivyAccessTokenFromHeaders,
	requirePrivyUserFromAccessToken,
	type AuthenticatedPrivyUser,
} from '@/lib/server/privy-auth'

type EntitlementStatus = 'active' | 'revoked' | 'expired'
type EntitlementSource = 'stripe' | 'invite' | 'grandfathered' | 'admin'

type MemberEntitlement = {
	id: string
	privy_user_id: string | null
	email: string | null
	wallet_address: string | null
	source: EntitlementSource
	status: EntitlementStatus
	stripe_customer_id: string | null
	stripe_checkout_session_id: string | null
	stripe_payment_intent_id: string | null
	invite_code: string | null
	granted_by: string | null
	granted_at: string
	expires_at: string | null
	metadata: Record<string, unknown>
	created_at: string
	updated_at: string
}

export type MemberAccessContext = {
	auth: AuthenticatedPrivyUser
	isAdmin: boolean
	entitlement: MemberEntitlement | null
}

export type MemberAccessScope = {
	hasAccess: boolean
	accessType: 'all_modules' | 'single_module' | 'admin'
	allowedModules: number[]
	entitlementId?: string
	rewardTrack?: 'full_academy' | 'single_module'
}

const ACCESS_TOKEN_COOKIE_NAMES = ['privy-token', 'privy-id-token'] as const

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : 'Unknown error'
}

function isUnauthorizedError(error: unknown): boolean {
	return getErrorMessage(error).startsWith('Unauthorized:')
}

async function getAccessToken(request?: Request): Promise<string | null> {
	if (request) {
		return getPrivyAccessTokenFromHeaders(request.headers)
	}

	const headerStore = await headers()
	const tokenFromHeaders = getPrivyAccessTokenFromHeaders(headerStore)
	if (tokenFromHeaders) return tokenFromHeaders

	const cookieStore = await cookies()
	for (const cookieName of ACCESS_TOKEN_COOKIE_NAMES) {
		const cookieValue = cookieStore.get(cookieName)?.value
		if (cookieValue && cookieValue.length > 0) {
			return decodeURIComponent(cookieValue)
		}
	}

	return null
}

async function getAuthenticatedUser(request?: Request): Promise<AuthenticatedPrivyUser> {
	const token = await getAccessToken(request)
	if (!token) throw new Error('Unauthorized: missing authentication token')

	try {
		return await requirePrivyUserFromAccessToken(token)
	} catch (error: unknown) {
		if (isUnauthorizedError(error)) {
			throw error
		}
		throw new Error('Unauthorized: invalid authentication token')
	}
}

async function isAdminUser(privyUserId: string): Promise<boolean> {
	const { data, error } = await getSupabaseAdmin()
		.from('iv_user_profiles')
		.select('role')
		.eq('privy_user_id', privyUserId)
		.maybeSingle<{ role: 'MEMBER' | 'VIP' | 'ADMIN' }>()

	if (error) throw error
	return data?.role === 'ADMIN'
}

async function findActiveEntitlement(
	column: 'privy_user_id' | 'email' | 'wallet_address',
	value: string,
): Promise<MemberEntitlement | null> {
	const nowIso = new Date().toISOString()

	const { data, error } = await getSupabaseAdmin()
		.from('iv_member_entitlements')
		.select('*')
		.eq(column, value)
		.eq('status', 'active')
		.or(`expires_at.is.null,expires_at.gt.${nowIso}`)
		.order('granted_at', { ascending: false })
		.limit(1)

	if (error) throw error
	if (!data || data.length === 0) return null

	return data[0] as MemberEntitlement
}

export async function requireMemberAccess(request?: Request): Promise<MemberAccessContext> {
	const auth = await getAuthenticatedUser(request)
	const isAdmin = await isAdminUser(auth.privyUserId)
	if (isAdmin) {
		return { auth, isAdmin: true, entitlement: null }
	}

	const checks: Array<Promise<MemberEntitlement | null>> = [findActiveEntitlement('privy_user_id', auth.privyUserId)]

	if (auth.email) {
		checks.push(findActiveEntitlement('email', auth.email))
	}

	if (auth.walletAddress) {
		checks.push(findActiveEntitlement('wallet_address', auth.walletAddress))
	}

	for (const check of checks) {
		const entitlement = await check
		if (entitlement) {
			return { auth, isAdmin: false, entitlement }
		}
	}

	throw new Error('Forbidden: member entitlement required')
}

function scopeFromEntitlement(entitlement: MemberEntitlement): MemberAccessScope {
	const metadata = entitlement.metadata ?? {}
	const accessType = metadata.access_type
	const moduleNumber = Number(metadata.module_number)

	if (accessType === 'single_module' && Number.isInteger(moduleNumber) && moduleNumber >= 1 && moduleNumber <= 6) {
		return {
			hasAccess: true,
			accessType: 'single_module',
			allowedModules: [moduleNumber],
			entitlementId: entitlement.id,
			rewardTrack: 'single_module',
		}
	}

	return {
		hasAccess: true,
		accessType: 'all_modules',
		allowedModules: [1, 2, 3, 4, 5, 6],
		entitlementId: entitlement.id,
		rewardTrack: 'full_academy',
	}
}

export async function getMemberAccessScope(request?: Request): Promise<MemberAccessScope> {
	const access = await requireMemberAccess(request)
	if (access.isAdmin) {
		return {
			hasAccess: true,
			accessType: 'admin',
			allowedModules: [1, 2, 3, 4, 5, 6],
			rewardTrack: 'full_academy',
		}
	}

	if (!access.entitlement) {
		throw new Error('Forbidden: member entitlement required')
	}

	return scopeFromEntitlement(access.entitlement)
}

export function canAccessModule(scope: MemberAccessScope, moduleNumber: number): boolean {
	return scope.hasAccess && scope.allowedModules.includes(moduleNumber)
}

export async function requireModuleAccess(request: Request | undefined, moduleNumber: number): Promise<MemberAccessScope> {
	if (!Number.isInteger(moduleNumber) || moduleNumber < 1 || moduleNumber > 6) {
		throw new Error('Forbidden: invalid module access request')
	}

	const scope = await getMemberAccessScope(request)
	if (!canAccessModule(scope, moduleNumber)) {
		throw new Error('Forbidden: module access not purchased')
	}

	return scope
}

export async function requireAdminAccess(request?: Request): Promise<MemberAccessContext> {
	const auth = await getAuthenticatedUser(request)
	const isAdmin = await isAdminUser(auth.privyUserId)

	if (!isAdmin) {
		throw new Error('Forbidden: admin access required')
	}

	return { auth, isAdmin: true, entitlement: null }
}
