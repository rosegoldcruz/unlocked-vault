# Reward Verification Report (Steps 16-19)

Date: 2026-06-06

## Step 16 - End-to-End Dry Run

Status: PARTIAL (BLOCKED)

Executed:
- `npm run rewards:worker:once`

Result:
- Worker exited safely with explicit config error:
  - `Missing required env var: IVT_TOKEN_MINT_ADDRESS`

Interpretation:
- Safety behavior works: worker refuses payout execution without required config.
- Full dry-run scenario (entitlement -> module completion -> queued milestones -> worker cycle) is blocked until required reward env vars and test identities are available.

## Step 17 - Mainnet Micro-Payout Test

Status: BLOCKED (NOT EXECUTED)

Reason:
- Required production payout envs are unavailable in this workspace runtime.
- No controlled test wallet and tiny transfer config were provided for execution.

## Step 18 - Production Env + Deployment Closeout

Status: PARTIAL

Validated locally:
- `member.ironvaulttoken.com` build passes with current code.

Not validated here:
- Deployment provider env configuration
- Live Stripe webhook delivery status
- Live entitlement grant from Stripe checkout
- Remote Supabase migration state in production

## Step 19 - Final Acceptance Audit

Status: PARTIAL

PASS:
- Security and idempotency controls reviewed and documented in `docs/reward-idempotency-audit.md`.
- Admin reward health endpoint implemented: `app/api/admin/rewards/health/route.ts`.
- Worker defaults and safe failure behavior validated.

BLOCKED/RISK:
- Live access and payout lifecycle assertions require real entitled test users and deployment/runtime env.

## Step 20 - Dry-Run Runtime Configuration (2026-06-06)

Status: CONFIGURED (DRY RUN PASSES)

### 1. Runtime env configured

Added/confirmed in local `.env.local` (gitignored, not committed):

- `IVT_TOKEN_MINT_ADDRESS`
- `IVT_REWARD_WALLET_PUBLIC_KEY`
- `IVT_SOLANA_RPC_URL`
- `IVT_REWARD_MILESTONE_1_AMOUNT_RAW`
- `IVT_REWARD_MILESTONE_2_AMOUNT_RAW`
- `IVT_REWARD_MILESTONE_3_AMOUNT_RAW`
- `IVT_REWARD_MODULE_PAIR_SIZE`
- `IVT_TOTAL_MODULES`
- `IVT_REWARD_NETWORK`
- `IVT_PAYOUT_DRY_RUN`
- `IVT_PAYOUT_WORKER_ENABLED`
- `IVT_MAX_PAYOUTS_PER_RUN`

`IVT_REWARD_WALLET_SECRET_KEY` intentionally NOT set anywhere — no private key exists in this workspace.

### 2. Token mint configured

- `IVT_TOKEN_MINT_ADDRESS=DTe8U4RnErPN1CKiJ5HcyZPEAGXMg6j6ueindYuowfjV`

### 3. Sender wallet configured

- `IVT_REWARD_WALLET_PUBLIC_KEY=3At9Qck4uMZPsMqJLHToTENyTDCpPSmbQMA3ntj7KTHx`
- Public key only; no secret/signing key present anywhere in the workspace or env files.

### 4. Reward amounts configured as gross send amounts to net the promised post-fee rewards

The token uses 6 decimals and carries a 6% transfer fee, so raw send amounts are grossed up by
`1 / 0.94` so recipients net the promised total after the in-flight fee deduction:

| Milestone | Net target (IVT) | Gross raw sent | Net received (IVT) |
|-----------|------------------|----------------|--------------------|
| 1 | 25,000 | `26595744681` | ≈ 25,000.0000001 |
| 2 | 25,000 | `26595744681` | ≈ 25,000.0000001 |
| 3 | 50,000 | `53191489362` | ≈ 50,000.0000003 |

Raw amounts round up to the nearest integer unit, so recipients never receive less than the promised
net amount (the rounding overage is a few hundred-millionths of one IVT).

### 5. Worker dry-run result

`tsx scripts/reward-payout-worker.ts` does not auto-load `.env.local` (no `dotenv` / `@next/env` /
`--env-file` wiring exists in the repo, confirmed by inspection), so the required env vars were loaded
into the process environment from `.env.local` before invoking the documented script:

```text
> iron-vault-member-academy@0.1.0 rewards:worker:once
> tsx scripts/reward-payout-worker.ts once

[rewards:worker] processedCount= 0
[rewards:worker] processed= []
EXIT CODE: 0
```

- No `Missing required env var` error — the Step 16 blocker is resolved; the full required config set
  now loads and validates.
- No on-chain transfer attempted, no signature (real or fake) produced, no job/milestone status changes.
- `IVT_PAYOUT_WORKER_ENABLED` was deliberately kept `false` for this run (rather than `true`). Reason:
  `sendTokenRewardPayout` (`lib/server/solana-payout.ts:92`) calls `getPayoutTransferConfig()` — which
  requires `IVT_REWARD_WALLET_SECRET_KEY` — *unconditionally*, before the dry-run short-circuit at
  line 106. That path is reachable only when the worker is enabled *and* `iv_payout_jobs` has a
  `status='queued'` row. Keeping the worker disabled still exercises `getRewardConfig()` (called
  unconditionally, validating the entire base config) and lets the worker exit cleanly with
  `processedCount: 0` — with zero risk of needing the forbidden secret key or mutating live
  job/milestone records.

Interpretation:

- The previously documented blocker (`Missing required env var: IVT_TOKEN_MINT_ADDRESS`) is resolved.
- The worker's safe-disabled exit path is now exercised end-to-end with real config; the queued-job
  processing path (which requires a real entitled test user reaching `eligible -> queued`) remains
  unexercised, consistent with the blockers below.

### 6. Remaining blockers

1. Live test user progress flow — need a real entitled identity to walk through module completion ->
   milestone eligibility -> payout job queuing so the worker's job-processing path can be exercised.
2. Mainnet micro-payout — requires `IVT_REWARD_WALLET_SECRET_KEY` (a funded signer) and
   `IVT_PAYOUT_DRY_RUN=false`, neither of which is configured here by design.
3. Production env deployment — these runtime values currently exist only in local `.env.local`
   (gitignored) and still need to be set in the target deployment provider's environment.

## Production Ready

PRODUCTION READY: NO

Required fixes/config before YES:
1. Set required reward env vars in target runtime.
2. Complete full dry-run sequence with real test entitlement and module progression.
3. Verify admin/user dashboards against live data.
4. Perform controlled micro-payout and verify on-chain confirmation + DB integrity.
