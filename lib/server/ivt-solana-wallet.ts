import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { PrivyClient } from '@privy-io/server-auth'
import { getSupabaseAdmin } from '@/lib/server/supabase-admin'

export const DEFAULT_IVT_TOKEN_MINT = 'DTe8U4RnErPN1CKiJ5HcyZPEAGXMg6j6ueindYuowfjV'

export function getIvtTokenMintAddress() {
  return process.env.IVT_TOKEN_MINT_ADDRESS?.trim() || DEFAULT_IVT_TOKEN_MINT
}

export type CanonicalSolanaWallet = {
  walletAddress: string | null
  source: 'profile' | 'privy' | 'none'
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
  return getSolscanWalletUrl(walletAddress)
}

export function getSolanaExplorerTxUrl(signature: string | null | undefined) {
  return getSolscanTxUrl(signature)
}

export function getSolanaExplorerTokenMintUrl() {
  return getSolscanTokenUrl(getIvtTokenMintAddress())
}

export function getSolscanWalletUrl(walletAddress: string | null | undefined) {
  if (!isValidSolanaPublicKey(walletAddress)) return null
  return `https://solscan.io/account/${walletAddress}`
}

export function getSolscanTokenUrl(tokenMint: string | null | undefined) {
  if (!isValidSolanaPublicKey(tokenMint)) return null
  return `https://solscan.io/token/${tokenMint}`
}

export function getSolscanTxUrl(signature: string | null | undefined) {
  if (!signature) return null
  return `https://solscan.io/tx/${signature}`
}

type PrivyWalletAccount = {
  type?: string
  walletClientType?: string
  wallet_client_type?: string
  chainType?: string
  chain_type?: string
  chain?: string
  address?: string
  wallet?: {
    address?: string
    chainType?: string
    chain_type?: string
    chain?: string
  }
}

function normalizeChainName(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function isWalletAccount(value: unknown): value is PrivyWalletAccount {
  if (!value || typeof value !== 'object') return false
  const account = value as PrivyWalletAccount
  return account.type === 'wallet'
    || account.type === 'smart_wallet'
    || typeof account.address === 'string'
    || typeof account.wallet?.address === 'string'
}

function isExplicitSolanaAccount(account: PrivyWalletAccount): boolean {
  const chainHints = [
    account.chainType,
    account.chain_type,
    account.chain,
    account.wallet?.chainType,
    account.wallet?.chain_type,
    account.wallet?.chain,
    account.walletClientType,
    account.wallet_client_type,
  ].map(normalizeChainName)

  return chainHints.some((hint) => hint.includes('solana') || hint === 'phantom' || hint === 'solflare')
}

function getExplicitPrivyLinkedAccounts(user: unknown): PrivyWalletAccount[] {
  if (!user || typeof user !== 'object') return []
  const record = user as {
    linkedAccounts?: unknown
    linked_accounts?: unknown
    wallet?: unknown
  }

  const accounts: PrivyWalletAccount[] = []
  const linkedAccounts = Array.isArray(record.linkedAccounts)
    ? record.linkedAccounts
    : Array.isArray(record.linked_accounts)
      ? record.linked_accounts
      : []

  for (const account of linkedAccounts) {
    if (isWalletAccount(account)) accounts.push(account)
  }

  if (isWalletAccount(record.wallet)) {
    accounts.push(record.wallet)
  }

  return accounts
}

function getAccountAddress(account: PrivyWalletAccount): string | null {
  if (typeof account.address === 'string') return account.address
  if (typeof account.wallet?.address === 'string') return account.wallet.address
  return null
}

function scanForFallbackSolanaWallets(value: unknown, found: string[]) {
  if (typeof value === 'string') {
    if (isValidSolanaPublicKey(value)) found.push(value)
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) scanForFallbackSolanaWallets(item, found)
    return
  }

  if (value && typeof value === 'object') {
    for (const nested of Object.values(value)) scanForFallbackSolanaWallets(nested, found)
  }
}

export async function getPrivySolanaWalletForUser(privyUserId: string): Promise<string | null> {
  const client = getPrivyClient()
  if (!client) return null

  try {
    const user = await client.getUser(privyUserId)
    const linkedAccounts = getExplicitPrivyLinkedAccounts(user)

    for (const account of linkedAccounts) {
      const address = getAccountAddress(account)
      if (isExplicitSolanaAccount(account) && isValidSolanaPublicKey(address)) {
        return address
      }
    }

    for (const account of linkedAccounts) {
      const address = getAccountAddress(account)
      if (isValidSolanaPublicKey(address)) {
        console.warn('[ivt-wallet] using linked wallet without explicit Solana chain hint as fallback')
        return address
      }
    }

    const fallbackFound: string[] = []
    scanForFallbackSolanaWallets(user, fallbackFound)
    const fallbackWallet = Array.from(new Set(fallbackFound))[0] ?? null
    if (fallbackWallet) {
      console.warn('[ivt-wallet] using recursive Privy Solana-shaped fallback; no explicit Solana linked wallet field found')
    }
    return fallbackWallet
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

  const privyWallet = await getPrivySolanaWalletForUser(privyUserId)
  if (privyWallet) {
    await supabase
      .from('iv_user_profiles')
      .update({ wallet_address: privyWallet })
      .eq('privy_user_id', privyUserId)
    return { walletAddress: privyWallet, source: 'privy' }
  }

  return { walletAddress: null, source: 'none' }
}

export async function getIvtTokenBalance(walletAddress: string | null | undefined, tokenMint = getIvtTokenMintAddress()): Promise<IvtTokenBalance> {
  if (!isValidSolanaPublicKey(walletAddress)) return null
  if (!isValidSolanaPublicKey(tokenMint)) return null

  try {
    const connection = getConnection()
    const owner = new PublicKey(walletAddress)
    const mint = new PublicKey(tokenMint)
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
