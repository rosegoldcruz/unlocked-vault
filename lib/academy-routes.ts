export const ACADEMY_ROUTES = {
  learn: '/learn',
  module0: '/learn/module-0',
  pricing: '/learn/pay',
  memberLogin: '/',
  academy: '/academy',
} as const

export function arePaymentsEnabled() {
  return process.env.PAYMENTS_ENABLED === 'true' || process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true'
}
