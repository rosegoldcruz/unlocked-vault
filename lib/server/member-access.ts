import { getSupabaseAdmin } from '@/lib/server/supabase-admin'
import { getOptionalIronVaultUser, requireIronVaultUser, type AuthenticatedIronVaultUser } from '@/lib/server/clerk-auth'
import { resolveCanonicalAccess, type AcademyPackage, type CoreAcademyAccess } from '@/lib/server/access-model'

type EntitlementStatus = 'active' | 'revoked' | 'expired'
type EntitlementSource = 'invite' | 'grandfathered' | 'admin'

type MemberEntitlement = {
	id: string
	privy_user_id: string | null
	email: string | null
	wallet_address: string | null
	source: EntitlementSource
	status: EntitlementStatus
	invite_code: string | null
	granted_by: string | null
	granted_at: string
	expires_at: string | null
	metadata: Record<string, unknown>
	package?: AcademyPackage | null
	core_academy_access?: CoreAcademyAccess | null
	developer_lab_access?: boolean | null
	created_at: string
	updated_at: string
}

export type MemberAccessContext = {
	auth: AuthenticatedIronVaultUser
	isAdmin: boolean
	entitlement: MemberEntitlement | null
	package: AcademyPackage
	coreAcademyAccess: CoreAcademyAccess
	developerLabAccess: boolean
}

export type MemberAccessScope = {
	hasAccess: boolean
	accessType: 'free' | 'all_modules' | 'single_module' | 'admin'
	allowedModules: number[]
	entitlementId?: string
	rewardTrack?: 'full_academy' | 'single_module'
	package: AcademyPackage
	coreAcademyAccess: CoreAcademyAccess
	developerLabAccess: boolean
}

export const FREE_ACADEMY_MODULE_ID = 0
export const FULL_ACADEMY_MODULE_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : 'Unknown error'
}

function isUnauthorizedError(error: unknown): boolean {
	return getErrorMessage(error).startsWith('Unauthorized:')
}

async function getAuthenticatedUser(_request?: Request): Promise<AuthenticatedIronVaultUser> {
	void _request
	return requireIronVaultUser()
}

export async function getOptionalAuthenticatedUser(_request?: Request): Promise<AuthenticatedIronVaultUser | null> {
	void _request
	try {
		return await getOptionalIronVaultUser()
	} catch (error: unknown) {
		if (isUnauthorizedError(error)) return null
		throw error
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
		return {
			auth,
			isAdmin: true,
			entitlement: null,
			package: 'ENTRY_LEVEL',
			coreAcademyAccess: 'FULL',
			developerLabAccess: true,
		}
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
			const canonical = resolveCanonicalAccess({
				package: entitlement.package,
				core_academy_access: entitlement.core_academy_access,
				developer_lab_access: entitlement.developer_lab_access,
				...entitlement.metadata,
			})
			return { auth, isAdmin: false, entitlement, ...canonical }
		}
	}

	throw new Error('Forbidden: member entitlement required')
}

function scopeFromEntitlement(entitlement: MemberEntitlement): MemberAccessScope {
	const canonical = resolveCanonicalAccess({
		package: entitlement.package,
		core_academy_access: entitlement.core_academy_access,
		developer_lab_access: entitlement.developer_lab_access,
		...entitlement.metadata,
	})
	if (canonical.coreAcademyAccess === 'FREE') {
		return {
			hasAccess: true,
			accessType: 'free',
			allowedModules: [FREE_ACADEMY_MODULE_ID],
			entitlementId: entitlement.id,
			...canonical,
		}
	}

	return {
		hasAccess: true,
		accessType: 'all_modules',
		allowedModules: [...FULL_ACADEMY_MODULE_IDS],
		entitlementId: entitlement.id,
		rewardTrack: 'full_academy',
		...canonical,
	}
}

export async function getMemberAccessScope(request?: Request): Promise<MemberAccessScope> {
	const access = await requireMemberAccess(request)
	if (access.isAdmin) {
		return {
			hasAccess: true,
			accessType: 'all_modules',
			allowedModules: [...FULL_ACADEMY_MODULE_IDS],
			rewardTrack: 'full_academy',
			package: 'ENTRY_LEVEL',
			coreAcademyAccess: 'FULL',
			developerLabAccess: true,
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

export function canAccessAcademyHub(): boolean {
	return true
}

export function canAccessAcademyModule(scope: MemberAccessScope | null, moduleNumber: number): boolean {
	if (moduleNumber === FREE_ACADEMY_MODULE_ID) return true
	if (!scope) return false
	return canAccessModule(scope, moduleNumber)
}

export function canAccessDashboard(scope: MemberAccessScope | null): boolean {
	return Boolean(scope?.hasAccess && scope.accessType !== 'free')
}

export function canAccessMemberFeature(scope: MemberAccessScope | null): boolean {
	return canAccessDashboard(scope)
}

export async function getAcademyAccessScope(request?: Request): Promise<{ auth: AuthenticatedIronVaultUser | null; scope: MemberAccessScope }> {
	const auth = await getOptionalAuthenticatedUser(request)
	if (!auth) {
		return {
			auth: null,
			scope: { hasAccess: true, accessType: 'free', allowedModules: [FREE_ACADEMY_MODULE_ID], package: 'ENTRY_LEVEL', coreAcademyAccess: 'FREE', developerLabAccess: false },
		}
	}

	try {
		const scope = await getMemberAccessScope(request)
		return { auth, scope }
	} catch (error: unknown) {
		const message = getErrorMessage(error)
		if (message.startsWith('Forbidden:')) {
			return {
				auth,
				scope: { hasAccess: true, accessType: 'free', allowedModules: [FREE_ACADEMY_MODULE_ID], package: 'ENTRY_LEVEL', coreAcademyAccess: 'FREE', developerLabAccess: false },
			}
		}
		throw error
	}
}

export async function requireModuleAccess(request: Request | undefined, moduleNumber: number): Promise<MemberAccessScope> {
	if (!Number.isInteger(moduleNumber) || !FULL_ACADEMY_MODULE_IDS.includes(moduleNumber as typeof FULL_ACADEMY_MODULE_IDS[number])) {
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

	return {
		auth,
		isAdmin: true,
		entitlement: null,
		package: 'ENTRY_LEVEL',
		coreAcademyAccess: 'FULL',
		developerLabAccess: true,
	}
}
