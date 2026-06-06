import { Connection, Keypair, PublicKey, Transaction, clusterApiUrl } from '@solana/web3.js'
import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  getMint,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
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
  let parsed: unknown
  try {
    parsed = JSON.parse(secretKeyRaw)
  } catch {
    throw new Error('Invalid IVT_REWARD_WALLET_SECRET_KEY: expected JSON array format')
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

  const transferConfig = getPayoutTransferConfig()
  const rewardWalletSecretKey = parseSecretKey(transferConfig.rewardWalletSecretKey)
  const signer = Keypair.fromSecretKey(rewardWalletSecretKey)

  if (signer.publicKey.toBase58() !== transferConfig.rewardWalletPublicKey) {
    throw new Error('IVT_REWARD_WALLET_SECRET_KEY does not match IVT_REWARD_WALLET_PUBLIC_KEY')
  }

  const connection = resolveConnection(transferConfig.solanaRpcUrl, transferConfig.network)
  const tokenMint = new PublicKey(transferConfig.tokenMintAddress)

  const sourceTokenAccount = getAssociatedTokenAddressSync(tokenMint, signer.publicKey)
  const destinationTokenAccount = getAssociatedTokenAddressSync(tokenMint, destinationWallet)

  if (transferConfig.payoutDryRun) {
    return {
      dryRun: true,
      signature: null,
      sourceTokenAccount: sourceTokenAccount.toBase58(),
      destinationTokenAccount: destinationTokenAccount.toBase58(),
    }
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
    TOKEN_PROGRAM_ID,
  )

  const mintInfo = await getMint(connection, tokenMint, 'confirmed', TOKEN_PROGRAM_ID)
  const transferInstruction = createTransferCheckedInstruction(
    sourceTokenAccount,
    tokenMint,
    destinationAta.address,
    signer.publicKey,
    amount,
    mintInfo.decimals,
    [],
    TOKEN_PROGRAM_ID,
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
