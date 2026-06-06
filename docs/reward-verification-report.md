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

## Step 16B — Controlled Test User Dry-Run

Date: 2026-06-06

Status: BLOCKED at Step 2 (no controlled entitled test user can exist in the current runtime database)

### Step 1 — Clean state confirmation

- `git status --short`: clean working tree.
- `git log --oneline -5`: HEAD = `85f4740 test: update reward dry-run runtime configuration`.
- `npm run build`: **PASS** — compiles successfully (one pre-existing unrelated warning:
  `Module not found: '@farcaster/mini-app-solana'` from `@privy-io/react-auth`, not from project code),
  all 17 routes generated, exit 0.

### Step 2 — Identify one controlled entitled test user

**Blocked: no controlled entitled test user exists — and none can be created yet, because the
entitlement schema itself is not deployed to the database this app runs against.**

Investigation:

- `.env.local` → `NEXT_PUBLIC_SUPABASE_URL` resolves to Supabase project `pujoapdxuddaavuklueh`
  ("iron-vault-token", region us-east-2) — the only Supabase project this codebase targets (no
  `supabase/config.toml`, no local stack).
- `list_tables` (public schema) on that project returns only: `profiles`, `progress`, `quiz_results`,
  `iv_payments`, `iv_user_profiles`, `iv_user_positions`, `iv_referral_leads`, `iv_status_tickets`.
- A targeted `information_schema.tables` lookup for the six tables this step depends on —
  `iv_member_entitlements`, `iv_member_invites`, `iv_module_completions`, `iv_reward_milestones`,
  `iv_payout_jobs`, `iv_payout_transactions` — returned **zero rows**. None of them exist in the
  connected database.
- `list_migrations` on the project shows the applied history stops at `20260602023030
  add_unique_index_provider_session_id`. The three newest local migration files —
  `supabase/migrations/20260605042000_create_backoffice_tables.sql`,
  `supabase/migrations/20260605121500_create_member_entitlements.sql`, and
  `supabase/migrations/20260605193000_create_reward_payout_tables.sql` — are **not** in the applied
  history. (The backoffice migration's tables happen to already exist remotely — likely created
  out-of-band via the dashboard/SQL editor — but the entitlement and reward-payout migrations were
  never applied by any mechanism: their tables are simply absent.)

Why this blocks Step 2 specifically: `iv_member_entitlements` is the *only* source of truth for
"active member entitlement" (`lib/server/member-access.ts:92-111`, `findActiveEntitlement`). With the
table absent, no row — real, test, invited, grandfathered, or admin-granted — can exist, so no account
in this environment currently satisfies "real entitled test user" as Step 2 requires. Fabricating one
is explicitly out of scope ("Do not fabricate values"), and the invite/admin-grant paths
(`/api/access/redeem-invite`, `iv_member_entitlements` inserts) are themselves no-ops against a
nonexistent table.

**Side effect worth flagging:** this also means `requireMemberAccess()` — the gate in front of
`/dashboard`, `/academy`, `/rewards`, and `/api/education-progress` for every *non-admin* account —
will throw a raw Postgres/PostgREST error (`Could not find the table 'public.iv_member_entitlements'
in the schema cache`) for any real non-admin user who reaches it right now, rather than a clean
"access required" response. Admin accounts bypass this check entirely (`isAdminUser` only reads
`iv_user_profiles`, which does exist), so the gap is invisible to admin testing — which is exactly why
using an admin account as the "test user" here would not be a valid substitute (it would bypass
entitlement gating, which is explicitly forbidden).

### Path to unblock (requires explicit approval — schema change to a live, shared database)

1. Apply the two pending migrations to project `pujoapdxuddaavuklueh`, in order:
   - `supabase/migrations/20260605121500_create_member_entitlements.sql`
   - `supabase/migrations/20260605193000_create_reward_payout_tables.sql`
   (via `supabase db push` from a linked CLI, or the Supabase migration tool — *not* hand-run
   `execute_sql`, so the migration history stays consistent with the repo.)
2. Then create exactly one controlled, clearly-labeled test entitlement row, e.g.:

   ```sql
   insert into public.iv_member_entitlements
     (privy_user_id, email, source, status, granted_by, metadata)
   values
     ('<real-test-privy-user-id>', '<real-test-email>', 'admin', 'active', '<your-admin-id>',
      '{"purpose": "step_16b_controlled_dry_run", "created": "2026-06-06"}'::jsonb);
   ```

   using the `privy_user_id` (and/or email/wallet) of one real, known, controlled test identity —
   e.g. an account you personally control and can log into in a real browser — not a fabricated value.
3. Re-run Step 16B from Step 2 once the row exists and the identity can log in and reach `/dashboard`.

### Steps 3-9

Not attempted — each depends on a controlled entitled test user existing (Step 2), which is impossible
until the schema above is deployed. No browser sessions were opened, no progress was saved, no DB rows
were read/written for any user, and the worker was not run in this pass.

### Confirmations

- Real transfer attempted: **no**
- Fake signature created: **no**
- Production users read or mutated: **no** (only schema metadata — table names, row *counts*, and
  migration history — was inspected; zero application data rows were read or written)
- `.env.local` committed: **no**
- `IVT_REWARD_WALLET_SECRET_KEY` added: **no**
- `IVT_PAYOUT_DRY_RUN` changed: **no** (remains `true`)

### Remaining blockers

1. **Entitlement + reward schema not deployed** (new, upstream of everything below) — migrations
   `20260605121500_create_member_entitlements.sql` and `20260605193000_create_reward_payout_tables.sql`
   have not been applied to the connected Supabase project; `iv_member_entitlements`,
   `iv_member_invites`, `iv_module_completions`, `iv_reward_milestones`, `iv_payout_jobs`, and
   `iv_payout_transactions` do not exist there.
2. Live test user progress flow (modules 1-6 lifecycle) — still requires a real entitled identity,
   now additionally blocked on (1).
3. Mainnet micro-payout — requires `IVT_REWARD_WALLET_SECRET_KEY` (funded signer) and
   `IVT_PAYOUT_DRY_RUN=false`, neither configured here by design.
4. Production env deployment — runtime reward env values exist only in local `.env.local` and still
   need to be set in the target deployment provider.

## Production Ready

PRODUCTION READY: NO

Required fixes/config before YES:
1. Set required reward env vars in target runtime.
2. Complete full dry-run sequence with real test entitlement and module progression.
3. Verify admin/user dashboards against live data.
4. Perform controlled micro-payout and verify on-chain confirmation + DB integrity.
