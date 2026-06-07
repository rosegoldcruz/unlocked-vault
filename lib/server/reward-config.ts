type RewardMilestoneNumber = 1 | 2 | 3

type RewardConfig = {
  modulePairSize: number
  totalModules: number
  network: string
  payoutWorkerEnabled: boolean
  payoutDryRun: boolean
  maxPayoutsPerRun: number
  tokenMintAddress: string
  rewardWalletPublicKey: string
  solanaRpcUrl: string
  rewardAmountsRaw: Record<RewardMilestoneNumber, string>
}

type RewardTransferConfig = RewardConfig & {
  rewardWalletSecretKey: string
}

function readEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

function readOptionalEnv(name: string, fallback: string): string {
  const value = process.env[name]
  if (!value) return fallback
  return value
}

function parseBoolean(value: string): boolean {
  return value.trim().toLowerCase() === 'true'
}

function parsePositiveInteger(name: string, value: string): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${name}: expected a positive integer`)
  }
  return parsed
}

function assertRawAmount(name: string, value: string): string {
  const trimmed = value.trim()
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`Invalid ${name}: expected raw integer amount string`)
  }
  if (trimmed === '0') {
    throw new Error(`Invalid ${name}: amount must be greater than zero`)
  }
  return trimmed
}

export function getRewardAmountRawForMilestone(milestoneNumber: number): string {
  if (!Number.isInteger(milestoneNumber) || milestoneNumber < 1 || milestoneNumber > 3) {
    throw new Error('Invalid milestoneNumber: expected integer between 1 and 3')
  }

  const envNameByMilestone: Record<RewardMilestoneNumber, string> = {
    1: 'IVT_REWARD_MILESTONE_1_AMOUNT_RAW',
    2: 'IVT_REWARD_MILESTONE_2_AMOUNT_RAW',
    3: 'IVT_REWARD_MILESTONE_3_AMOUNT_RAW',
  }

  const envName = envNameByMilestone[milestoneNumber as RewardMilestoneNumber]
  return assertRawAmount(envName, readEnv(envName))
}

export function getSingleModuleRewardAmountRaw(): string {
  return assertRawAmount('IVT_REWARD_SINGLE_MODULE_AMOUNT_RAW', readEnv('IVT_REWARD_SINGLE_MODULE_AMOUNT_RAW'))
}

export function getRewardConfig(): RewardConfig {
  const tokenMintAddress = readEnv('IVT_TOKEN_MINT_ADDRESS').trim()
  const rewardWalletPublicKey = readEnv('IVT_REWARD_WALLET_PUBLIC_KEY').trim()
  const solanaRpcUrl = readEnv('IVT_SOLANA_RPC_URL').trim()

  if (!tokenMintAddress) throw new Error('Missing required env var: IVT_TOKEN_MINT_ADDRESS')
  if (!rewardWalletPublicKey) throw new Error('Missing required env var: IVT_REWARD_WALLET_PUBLIC_KEY')
  if (!solanaRpcUrl) throw new Error('Missing required env var: IVT_SOLANA_RPC_URL')

  const modulePairSize = parsePositiveInteger(
    'IVT_REWARD_MODULE_PAIR_SIZE',
    readOptionalEnv('IVT_REWARD_MODULE_PAIR_SIZE', '2'),
  )

  const totalModules = parsePositiveInteger(
    'IVT_TOTAL_MODULES',
    readOptionalEnv('IVT_TOTAL_MODULES', '6'),
  )

  const maxPayoutsPerRun = parsePositiveInteger(
    'IVT_MAX_PAYOUTS_PER_RUN',
    readOptionalEnv('IVT_MAX_PAYOUTS_PER_RUN', '10'),
  )

  const rewardAmountsRaw: Record<RewardMilestoneNumber, string> = {
    1: getRewardAmountRawForMilestone(1),
    2: getRewardAmountRawForMilestone(2),
    3: getRewardAmountRawForMilestone(3),
  }

  return {
    modulePairSize,
    totalModules,
    network: readOptionalEnv('IVT_REWARD_NETWORK', 'mainnet-beta').trim(),
    payoutWorkerEnabled: parseBoolean(readOptionalEnv('IVT_PAYOUT_WORKER_ENABLED', 'false')),
    payoutDryRun: parseBoolean(readOptionalEnv('IVT_PAYOUT_DRY_RUN', 'true')),
    maxPayoutsPerRun,
    tokenMintAddress,
    rewardWalletPublicKey,
    solanaRpcUrl,
    rewardAmountsRaw,
  }
}

export function getPayoutTransferConfig(): RewardTransferConfig {
  const baseConfig = getRewardConfig()
  const rewardWalletSecretKey = readEnv('IVT_REWARD_WALLET_SECRET_KEY').trim()

  if (!rewardWalletSecretKey) {
    throw new Error('Missing required env var: IVT_REWARD_WALLET_SECRET_KEY')
  }

  return {
    ...baseConfig,
    rewardWalletSecretKey,
  }
}

export function getRedactedRewardConfig() {
  const config = getRewardConfig()
  return {
    modulePairSize: config.modulePairSize,
    totalModules: config.totalModules,
    network: config.network,
    payoutWorkerEnabled: config.payoutWorkerEnabled,
    payoutDryRun: config.payoutDryRun,
    maxPayoutsPerRun: config.maxPayoutsPerRun,
    tokenMintAddress: config.tokenMintAddress,
    rewardWalletPublicKey: config.rewardWalletPublicKey,
    solanaRpcUrl: config.solanaRpcUrl,
    rewardAmountsRaw: config.rewardAmountsRaw,
    hasTransferSecretKey: Boolean(process.env.IVT_REWARD_WALLET_SECRET_KEY),
  }
}
