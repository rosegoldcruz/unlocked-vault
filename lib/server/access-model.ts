export const PACKAGE_NAMES = ['ENTRY_LEVEL', 'INTERMEDIATE', 'ADVANCED', 'ELITE'] as const
export type AcademyPackage = typeof PACKAGE_NAMES[number]
export type CoreAcademyAccess = 'FREE' | 'FULL'

export type CanonicalAccess = {
	package: AcademyPackage
	coreAcademyAccess: CoreAcademyAccess
	developerLabAccess: boolean
}

function normalize(value: unknown): string | null {
	if (typeof value !== 'string') return null
	const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, '_')
	return normalized || null
}

export function packageFromMetadata(metadata?: Record<string, unknown> | null): AcademyPackage {
	const values = [
		metadata?.package,
		metadata?.package_key,
		metadata?.product_key,
		metadata?.productKey,
		metadata?.legacy_tier,
		metadata?.legacyTier,
		metadata?.payment_tier,
		metadata?.paymentTier,
		metadata?.tier,
	]

	for (const value of values) {
		const key = normalize(value)
		if (key === 'ELITE' || key === 'FOUNDER' || key === 'FOUNDER_ELITE') return 'ELITE'
		if (key === 'ADVANCED' || key === 'BUILDER' || key === 'BUILDER_ACCELERATOR' || key === 'ACCELERATOR') return 'ADVANCED'
		if (key === 'INTERMEDIATE' || key === 'FOUNDATION' || key === 'STARTER') return 'INTERMEDIATE'
		if (key === 'ENTRY_LEVEL' || key === 'ENTRY' || key === 'MODULE' || key === 'SINGLE_MODULE') return 'ENTRY_LEVEL'
	}

	return 'ENTRY_LEVEL'
}

export function resolveCanonicalAccess(metadata?: Record<string, unknown> | null): CanonicalAccess {
	const packageName = packageFromMetadata(metadata)
	const coreAcademyAccess: CoreAcademyAccess = metadata?.core_academy_access === 'FULL' || metadata?.coreAcademyAccess === 'FULL'
		? 'FULL'
		: packageName === 'ENTRY_LEVEL' ? 'FREE' : 'FULL'
	const developerLabAccess = metadata?.developer_lab_access === true || metadata?.developer_lab_access === 'true'
		|| metadata?.developerLabAccess === true || packageName === 'ELITE'
	return {
		package: packageName,
		coreAcademyAccess,
		developerLabAccess,
	}
}

export function packageLabel(packageName: AcademyPackage): string {
	return packageName === 'ENTRY_LEVEL' ? 'Entry-Level' : packageName[0] + packageName.slice(1).toLowerCase()
}