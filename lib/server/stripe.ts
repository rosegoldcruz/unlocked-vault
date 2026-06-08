import Stripe from 'stripe'

const ALL_MODULES = ['module_1', 'module_2', 'module_3', 'module_4', 'module_5', 'module_6'] as const
export type StripeModule = typeof ALL_MODULES[number]

export const TIER_CONFIG = {
  ENTRY: {
    priceEnv: 'STRIPE_PRICE_ENTRY',
    label: 'Entry',
    accessType: 'single_module' as const,
    paymentTier: 'single_module',
    rewardTrack: 'single_module' as const,
    requiresModuleNumber: true,
  },
  FOUNDATION: {
    priceEnv: 'STRIPE_PRICE_FOUNDATION',
    label: 'Foundation',
    accessType: 'all_modules' as const,
    paymentTier: 'foundation',
    rewardTrack: 'full_academy' as const,
    requiresModuleNumber: false,
    modulesToUnlock: [...ALL_MODULES] as StripeModule[],
  },
  BUILDER_ACCELERATOR: {
    priceEnv: 'STRIPE_PRICE_BUILDER_ACCELERATOR',
    label: 'Builder Accelerator',
    accessType: 'all_modules' as const,
    paymentTier: 'accelerator',
    rewardTrack: 'full_academy' as const,
    requiresModuleNumber: false,
    modulesToUnlock: [...ALL_MODULES] as StripeModule[],
  },
  FOUNDER_ELITE: {
    priceEnv: 'STRIPE_PRICE_FOUNDER_ELITE',
    label: 'Founder Elite',
    accessType: 'all_modules' as const,
    paymentTier: 'founder',
    rewardTrack: 'full_academy' as const,
    requiresModuleNumber: false,
    modulesToUnlock: [...ALL_MODULES] as StripeModule[],
  },
} as const

export type TierKey = keyof typeof TIER_CONFIG

export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

export function getTierConfig(tier: unknown) {
  if (!tier || typeof tier !== 'string' || !Object.hasOwn(TIER_CONFIG, tier)) return null
  return TIER_CONFIG[tier as TierKey]
}

export function getStripe(): Stripe {
  return new Stripe(requireEnv('STRIPE_SECRET_KEY'))
}
