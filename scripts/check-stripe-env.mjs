import { readFileSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(process.cwd(), '.env.local')
let raw = ''
try { raw = readFileSync(envPath, 'utf8') } catch { console.error('No .env.local found'); process.exit(1) }

const env = {}
for (const line of raw.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq < 0) continue
  env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1)
}

const names = [
  'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_ENTRY',
  'STRIPE_PRICE_FOUNDATION', 'STRIPE_PRICE_BUILDER_ACCELERATOR',
  'STRIPE_PRICE_FOUNDER_ELITE', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_BASE_URL'
]

for (const name of names) {
  const value = env[name]
  if (!value) { console.log('MISSING: ' + name); continue }
  const mode =
    value.startsWith('sk_live') ? 'LIVE-SK' :
    value.startsWith('sk_test') ? 'TEST-SK' :
    value.startsWith('pk_live') ? 'LIVE-PK' :
    value.startsWith('pk_test') ? 'TEST-PK' :
    value.startsWith('whsec_') ? 'WEBHOOK-SECRET' :
    value.startsWith('price_') ? 'PRICE-ID' :
    'PRESENT'
  console.log('OK: ' + name + ' mode=' + mode + ' len=' + value.length)
}
