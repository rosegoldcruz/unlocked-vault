import {
  buildRewardTierJobMetadata,
  getRewardAmountRawForMilestone,
  getSingleModuleRewardAmountRaw,
  resolveRewardProductTier,
  type RewardTierMetadata,
} from '@/lib/server/reward-config'

const EXPECTED = {
  INTERNAL_TEST: '3191490',
  ENTRY: '26595744681',
  FOUNDATION: ['26595744681', '26595744681', '53191489362'],
  BUILDER_ACCELERATOR: ['132978723405', '132978723405', '265957446810'],
  FOUNDER_ELITE: ['265957446810', '265957446810', '531914893620'],
} as const

const TEST_ENV: Record<string, string> = {
  IVT_REWARD_SINGLE_MODULE_AMOUNT_RAW: EXPECTED.INTERNAL_TEST,
  IVT_REWARD_ENTRY_SINGLE_MODULE_AMOUNT_RAW: EXPECTED.ENTRY,
  IVT_REWARD_FOUNDATION_MILESTONE_1_AMOUNT_RAW: EXPECTED.FOUNDATION[0],
  IVT_REWARD_FOUNDATION_MILESTONE_2_AMOUNT_RAW: EXPECTED.FOUNDATION[1],
  IVT_REWARD_FOUNDATION_MILESTONE_3_AMOUNT_RAW: EXPECTED.FOUNDATION[2],
  IVT_REWARD_BUILDER_MILESTONE_1_AMOUNT_RAW: EXPECTED.BUILDER_ACCELERATOR[0],
  IVT_REWARD_BUILDER_MILESTONE_2_AMOUNT_RAW: EXPECTED.BUILDER_ACCELERATOR[1],
  IVT_REWARD_BUILDER_MILESTONE_3_AMOUNT_RAW: EXPECTED.BUILDER_ACCELERATOR[2],
  IVT_REWARD_FOUNDER_MILESTONE_1_AMOUNT_RAW: EXPECTED.FOUNDER_ELITE[0],
  IVT_REWARD_FOUNDER_MILESTONE_2_AMOUNT_RAW: EXPECTED.FOUNDER_ELITE[1],
  IVT_REWARD_FOUNDER_MILESTONE_3_AMOUNT_RAW: EXPECTED.FOUNDER_ELITE[2],
  IVT_REWARD_MILESTONE_1_AMOUNT_RAW: '1',
  IVT_REWARD_MILESTONE_2_AMOUNT_RAW: '1',
  IVT_REWARD_MILESTONE_3_AMOUNT_RAW: '1',
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message)
}

function assertEqual(actual: string | null | undefined, expected: string, message: string) {
  assert(actual === expected, `${message}: expected ${expected}, received ${actual ?? 'null'}`)
}

function assertThrows(fn: () => unknown, expectedMessagePart: string, message: string) {
  try {
    fn()
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    assert(errorMessage.includes(expectedMessagePart), `${message}: unexpected error message: ${errorMessage}`)
    return
  }

  throw new Error(`${message}: expected throw`)
}

function metadataFor(productKey: string, overrides: RewardTierMetadata = {}): RewardTierMetadata {
  const fullAcademy = productKey !== 'INTERNAL_TEST' && productKey !== 'ENTRY'
  return {
    product_key: productKey,
    legacyTier: productKey,
    tier: productKey === 'ENTRY' ? 'single_module' : productKey.toLowerCase(),
    paymentTier: productKey === 'ENTRY' ? 'single_module' : productKey.toLowerCase(),
    access_type: fullAcademy ? 'all_modules' : 'single_module',
    reward_track: fullAcademy ? 'full_academy' : 'single_module',
    ...overrides,
  }
}

const originalEnv = new Map<string, string | undefined>()
for (const key of Object.keys(TEST_ENV)) originalEnv.set(key, process.env[key])

try {
  Object.assign(process.env, TEST_ENV)

  assertEqual(resolveRewardProductTier(metadataFor('INTERNAL_TEST', { internal_test: 'true' })), 'INTERNAL_TEST', 'INTERNAL_TEST tier resolution')
  assertEqual(
    getSingleModuleRewardAmountRaw(metadataFor('INTERNAL_TEST', { internal_test: 'true' }), {
      rewardTrack: 'single_module',
      accessType: 'single_module',
      moduleNumber: 1,
    }),
    EXPECTED.INTERNAL_TEST,
    'INTERNAL_TEST amount',
  )
  assertEqual(resolveRewardProductTier(metadataFor('ENTRY')), 'ENTRY', 'ENTRY tier resolution')
  assertEqual(
    getSingleModuleRewardAmountRaw(metadataFor('ENTRY'), {
      rewardTrack: 'single_module',
      accessType: 'single_module',
      moduleNumber: 1,
    }),
    EXPECTED.ENTRY,
    'ENTRY amount',
  )

  for (const [tier, amounts] of [
    ['FOUNDATION', EXPECTED.FOUNDATION],
    ['BUILDER_ACCELERATOR', EXPECTED.BUILDER_ACCELERATOR],
    ['FOUNDER_ELITE', EXPECTED.FOUNDER_ELITE],
  ] as const) {
    assertEqual(resolveRewardProductTier(metadataFor(tier)), tier, `${tier} tier resolution`)
    for (const [index, expectedAmount] of amounts.entries()) {
      assertEqual(
        getRewardAmountRawForMilestone(index + 1, metadataFor(tier), {
          rewardTrack: 'full_academy',
          accessType: 'all_modules',
          milestoneNumber: index + 1,
        }),
        expectedAmount,
        `${tier} milestone ${index + 1}`,
      )
    }
  }

  assertEqual(
    getRewardAmountRawForMilestone(1, metadataFor('FOUNDATION'), {
      rewardTrack: 'full_academy',
      accessType: 'all_modules',
      milestoneNumber: 1,
    }),
    EXPECTED.FOUNDATION[0],
    'Shared legacy milestone env is not used for FOUNDATION',
  )

  delete process.env.IVT_REWARD_BUILDER_MILESTONE_2_AMOUNT_RAW
  try {
    getRewardAmountRawForMilestone(2, metadataFor('BUILDER_ACCELERATOR'), {
      rewardTrack: 'full_academy',
      accessType: 'all_modules',
      milestoneNumber: 2,
    })
    throw new Error('Missing required tier env did not throw')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    assert(
      message === 'Missing required env var: IVT_REWARD_BUILDER_MILESTONE_2_AMOUNT_RAW',
      `Missing env error was not clear: ${message}`,
    )
  } finally {
    process.env.IVT_REWARD_BUILDER_MILESTONE_2_AMOUNT_RAW = TEST_ENV.IVT_REWARD_BUILDER_MILESTONE_2_AMOUNT_RAW
  }

  const strictMessage = 'Missing or unsupported product tier'
  assertThrows(
    () => getRewardAmountRawForMilestone(1, {
      access_type: 'all_modules',
      reward_track: 'full_academy',
    }, {
      rewardTrack: 'full_academy',
      accessType: 'all_modules',
      milestoneNumber: 1,
    }),
    strictMessage,
    'full_academy missing tier',
  )
  assertThrows(
    () => getRewardAmountRawForMilestone(1, metadataFor('UNKNOWN'), {
      rewardTrack: 'full_academy',
      accessType: 'all_modules',
      milestoneNumber: 1,
    }),
    strictMessage,
    'full_academy unknown tier',
  )
  assertThrows(
    () => getSingleModuleRewardAmountRaw({
      access_type: 'single_module',
      reward_track: 'single_module',
    }, {
      rewardTrack: 'single_module',
      accessType: 'single_module',
      moduleNumber: 1,
    }),
    strictMessage,
    'single_module missing tier',
  )
  assertThrows(
    () => getSingleModuleRewardAmountRaw(metadataFor('UNKNOWN', {
      access_type: 'single_module',
      reward_track: 'single_module',
    }), {
      rewardTrack: 'single_module',
      accessType: 'single_module',
      moduleNumber: 1,
    }),
    strictMessage,
    'single_module unknown tier',
  )
  assertThrows(
    () => getRewardAmountRawForMilestone(1, {
      product_key: 'FOUNDATION',
      access_type: 'single_module',
      reward_track: 'single_module',
    }, {
      rewardTrack: 'full_academy',
      accessType: 'all_modules',
      milestoneNumber: 1,
    }),
    strictMessage,
    'full_academy wrong reward shape',
  )

  const jobMetadata = buildRewardTierJobMetadata(metadataFor('FOUNDER_ELITE'))
  assertEqual(String(jobMetadata.product_key), 'FOUNDER_ELITE', 'Job metadata product_key')
  assertEqual(String(jobMetadata.legacyTier), 'FOUNDER_ELITE', 'Job metadata legacyTier')
  assertEqual(String(jobMetadata.paymentTier), 'founder_elite', 'Job metadata paymentTier')
  assertEqual(String(jobMetadata.access_type), 'all_modules', 'Job metadata access_type')
  assertEqual(String(jobMetadata.reward_track), 'full_academy', 'Job metadata reward_track')

  console.log('TIER REWARD AMOUNTS VERIFIED')
  console.log(`INTERNAL_TEST=${EXPECTED.INTERNAL_TEST}`)
  console.log(`ENTRY=${EXPECTED.ENTRY}`)
  console.log(`FOUNDATION=${EXPECTED.FOUNDATION.join(',')}`)
  console.log(`BUILDER_ACCELERATOR=${EXPECTED.BUILDER_ACCELERATOR.join(',')}`)
  console.log(`FOUNDER_ELITE=${EXPECTED.FOUNDER_ELITE.join(',')}`)
  console.log('missing tier env error=yes')
  console.log('missing tier metadata error=yes')
  console.log('unknown tier metadata error=yes')
  console.log('legacy shared milestone fallback used=no')
  console.log('payout job tier metadata=yes')
} finally {
  for (const [key, value] of originalEnv) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
}
