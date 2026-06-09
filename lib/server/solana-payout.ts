import { Connection, Keypair, PublicKey, Transaction, clusterApiUrl } from '@solana/web3.js'
import bs58 from 'bs58'
import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  getMint,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token'
import { getPayoutTransferConfig, getRewardConfig } from '@/lib/server/reward-config'

export type PayoutRequest = {
  destinationWalletAddress: string
  amountRaw: string
}

export type PayoutResult = {
  dryRun: boolean
  signature: string | null
  sourceTokenAccount: string
  destinationTokenAccount: string
}

function parseSecretKey(secretKeyRaw: string): Uint8Array {
  const trimmed = secretKeyRaw.trim()

  if (!trimmed.startsWith('[')) {
    const decoded = bs58.decode(trimmed)
    if (decoded.length !== 64) {
      throw new Error('Invalid IVT_REWARD_WALLET_SECRET_KEY: expected 64-byte base58 secret key')
    }
    return decoded
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    throw new Error('Invalid IVT_REWARD_WALLET_SECRET_KEY: expected base58 or JSON array format')
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Invalid IVT_REWARD_WALLET_SECRET_KEY: expected non-empty JSON array')
  }

  const normalized = parsed.map((value) => {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 255) {
      throw new Error('Invalid IVT_REWARD_WALLET_SECRET_KEY: array values must be integers 0..255')
    }
    return value
  })

  return Uint8Array.from(normalized)
}

function parseAmountRaw(amountRaw: string): bigint {
  if (!/^\d+$/.test(amountRaw)) {
    throw new Error('Invalid payout amount: expected raw integer amount string')
  }

  const amount = BigInt(amountRaw)
  if (amount <= BigInt(0)) {
    throw new Error('Invalid payout amount: amount must be greater than zero')
  }

  return amount
}

function resolveConnection(rpcUrl: string, network: string): Connection {
  const endpoint = rpcUrl.startsWith('http://') || rpcUrl.startsWith('https://')
    ? rpcUrl
    : clusterApiUrl(network as 'mainnet-beta' | 'devnet' | 'testnet')

  return new Connection(endpoint, 'confirmed')
}

async function resolveTokenProgramId(connection: Connection, tokenMint: PublicKey): Promise<PublicKey> {
  const mintAccount = await connection.getAccountInfo(tokenMint, 'confirmed')
  if (!mintAccount) {
    throw new Error('Token mint account not found')
  }

  if (mintAccount.owner.equals(TOKEN_PROGRAM_ID) || mintAccount.owner.equals(TOKEN_2022_PROGRAM_ID)) {
    return mintAccount.owner
  }

  throw new Error('Unsupported token mint program')
}

export function validatePayoutTransferConfig(): {
  tokenMint: PublicKey
  rewardWalletPublicKey: PublicKey
  connection: Connection
  dryRun: boolean
  payoutWorkerEnabled: boolean
} {
  const config = getRewardConfig()

  const tokenMint = new PublicKey(config.tokenMintAddress)
  const rewardWalletPublicKey = new PublicKey(config.rewardWalletPublicKey)
  const connection = resolveConnection(config.solanaRpcUrl, config.network)

  return {
    tokenMint,
    rewardWalletPublicKey,
    connection,
    dryRun: config.payoutDryRun,
    payoutWorkerEnabled: config.payoutWorkerEnabled,
  }
}

export async function sendTokenRewardPayout(request: PayoutRequest): Promise<PayoutResult> {
  const destinationWallet = new PublicKey(request.destinationWalletAddress)
  const amount = parseAmountRaw(request.amountRaw)

  const config = getRewardConfig()
  const connection = resolveConnection(config.solanaRpcUrl, config.network)
  const tokenMint = new PublicKey(config.tokenMintAddress)
  const rewardWalletPublicKey = new PublicKey(config.rewardWalletPublicKey)
  const tokenProgramId = await resolveTokenProgramId(connection, tokenMint)

  const sourceTokenAccount = getAssociatedTokenAddressSync(tokenMint, rewardWalletPublicKey, false, tokenProgramId)
  const destinationTokenAccount = getAssociatedTokenAddressSync(tokenMint, destinationWallet, false, tokenProgramId)

  if (config.payoutDryRun) {
    return {
      dryRun: true,
      signature: null,
      sourceTokenAccount: sourceTokenAccount.toBase58(),
      destinationTokenAccount: destinationTokenAccount.toBase58(),
    }
  }

  const transferConfig = getPayoutTransferConfig()
  const rewardWalletSecretKey = parseSecretKey(transferConfig.rewardWalletSecretKey)
  const signer = Keypair.fromSecretKey(rewardWalletSecretKey)

  if (signer.publicKey.toBase58() !== transferConfig.rewardWalletPublicKey) {
    throw new Error('IVT_REWARD_WALLET_SECRET_KEY does not match IVT_REWARD_WALLET_PUBLIC_KEY')
  }

  const destinationAta = await getOrCreateAssociatedTokenAccount(
    connection,
    signer,
    tokenMint,
    destinationWallet,
    false,
    'confirmed',
    {
      commitment: 'confirmed',
    },
    tokenProgramId,
  )

  const mintInfo = await getMint(connection, tokenMint, 'confirmed', tokenProgramId)
  const transferInstruction = createTransferCheckedInstruction(
    sourceTokenAccount,
    tokenMint,
    destinationAta.address,
    signer.publicKey,
    amount,
    mintInfo.decimals,
    [],
    tokenProgramId,
  )

  const latestBlockhash = await connection.getLatestBlockhash('confirmed')

  const transaction = new Transaction({
    feePayer: signer.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
  }).add(transferInstruction)

  const signature = await connection.sendTransaction(transaction, [signer], {
    preflightCommitment: 'confirmed',
    skipPreflight: false,
  })

  await connection.confirmTransaction(
    {
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      signature,
    },
    'confirmed',
  )

  return {
    dryRun: false,
    signature,
    sourceTokenAccount: sourceTokenAccount.toBase58(),
    destinationTokenAccount: destinationAta.address.toBase58(),
  }
}
