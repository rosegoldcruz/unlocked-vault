import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { PrivyClient } from '@privy-io/server-auth'
import { getSupabaseAdmin } from '@/lib/server/supabase-admin'

export const IVT_TOKEN_MINT = 'DTe8U4RnErPN1CKiJ5HcyZPEAGXMg6j6ueindYuowfjV'

export type CanonicalSolanaWallet = {
  walletAddress: string | null
  source: 'profile' | 'payout_job' | 'privy' | 'none'
}

export type IvtTokenBalance = {
  amountRaw: string
  decimals: number
  uiAmount: string
} | null

function getPrivyClient(): PrivyClient | null {
  const appId = process.env.PRIVY_APP_ID || process.env.NEXT_PUBLIC_PRIVY_APP_ID
  const appSecret = process.env.PRIVY_APP_SECRET
  if (!appId || !appSecret) return null
  return new PrivyClient(appId, appSecret)
}

function getConnection() {
  const network = process.env.IVT_REWARD_NETWORK || 'mainnet-beta'
  const rpcUrl = process.env.IVT_SOLANA_RPC_URL
  const endpoint = rpcUrl && (rpcUrl.startsWith('http://') || rpcUrl.startsWith('https://'))
    ? rpcUrl
    : clusterApiUrl(network as 'mainnet-beta' | 'devnet' | 'testnet')
  return new Connection(endpoint, 'confirmed')
}

export function isValidSolanaPublicKey(value: string | null | undefined): value is string {
  if (!value || value.startsWith('0x')) return false
  try {
    return new PublicKey(value).toBase58() === value
  } catch {
    return false
  }
}

export function getSolanaExplorerWalletUrl(walletAddress: string | null | undefined) {
  if (!isValidSolanaPublicKey(walletAddress)) return null
  return `https://explorer.solana.com/address/${walletAddress}`
}

export function getSolanaExplorerTxUrl(signature: string | null | undefined) {
  if (!signature) return null
  return `https://explorer.solana.com/tx/${signature}`
}

export function getSolanaExplorerTokenMintUrl() {
  return `https://explorer.solana.com/address/${IVT_TOKEN_MINT}`
}

function scanForSolanaWallets(value: unknown, found: string[]) {
  if (typeof value === 'string') {
    if (isValidSolanaPublicKey(value)) found.push(value)
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) scanForSolanaWallets(item, found)
    return
  }

  if (value && typeof value === 'object') {
    for (const nested of Object.values(value)) scanForSolanaWallets(nested, found)
  }
}

async function getPrivySolanaWallet(privyUserId: string): Promise<string | null> {
  const client = getPrivyClient()
  if (!client) return null

  try {
    const user = await client.getUser(privyUserId)
    const found: string[] = []
    scanForSolanaWallets(user, found)
    return Array.from(new Set(found))[0] ?? null
  } catch {
    return null
  }
}

export async function getCanonicalSolanaWalletForUser(privyUserId: string): Promise<CanonicalSolanaWallet> {
  const supabase = getSupabaseAdmin()

  const { data: profile } = await supabase
    .from('iv_user_profiles')
    .select('wallet_address')
    .eq('privy_user_id', privyUserId)
    .maybeSingle<{ wallet_address: string | null }>()

  if (isValidSolanaPublicKey(profile?.wallet_address)) {
    return { walletAddress: profile.wallet_address, source: 'profile' }
  }

  const { data: payoutJobs } = await supabase
    .from('iv_payout_jobs')
    .select('wallet_address, created_at')
    .eq('privy_user_id', privyUserId)
    .in('status', ['paid', 'queued'])
    .order('created_at', { ascending: false })
    .limit(10)

  const payoutWallet = (payoutJobs ?? [])
    .map((row) => (row as { wallet_address: string | null }).wallet_address)
    .find(isValidSolanaPublicKey)

  if (payoutWallet) {
    return { walletAddress: payoutWallet, source: 'payout_job' }
  }

  const privyWallet = await getPrivySolanaWallet(privyUserId)
  if (privyWallet) {
    return { walletAddress: privyWallet, source: 'privy' }
  }

  return { walletAddress: null, source: 'none' }
}

export async function getIvtTokenBalance(walletAddress: string | null | undefined): Promise<IvtTokenBalance> {
  if (!isValidSolanaPublicKey(walletAddress)) return null

  try {
    const connection = getConnection()
    const owner = new PublicKey(walletAddress)
    const mint = new PublicKey(IVT_TOKEN_MINT)
    const accounts = await connection.getParsedTokenAccountsByOwner(owner, { mint }, 'confirmed')

    let totalRaw = BigInt(0)
    let decimals = 0

    for (const account of accounts.value) {
      const tokenAmount = account.account.data.parsed.info.tokenAmount as { amount: string; decimals: number }
      totalRaw += BigInt(tokenAmount.amount)
      decimals = tokenAmount.decimals
    }

    const divisor = BigInt(10) ** BigInt(decimals)
    const whole = totalRaw / divisor
    const fraction = totalRaw % divisor
    const fractionText = decimals > 0
      ? fraction.toString().padStart(decimals, '0').replace(/0+$/, '')
      : ''

    return {
      amountRaw: totalRaw.toString(),
      decimals,
      uiAmount: fractionText ? `${whole.toString()}.${fractionText}` : whole.toString(),
    }
  } catch {
    return null
  }
}