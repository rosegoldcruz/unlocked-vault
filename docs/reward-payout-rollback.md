# Reward Payout Rollback And Kill Switch

This runbook covers emergency controls for the reward pipeline:
- iv_module_completions
- iv_reward_milestones
- iv_payout_jobs
- iv_payout_transactions
- iv_member_entitlements

## 1) Disable Payout Worker Immediately

Set:
- `IVT_PAYOUT_WORKER_ENABLED=false`

Then redeploy/restart worker runtime.

## 2) Force Dry-Run Mode

Set:
- `IVT_PAYOUT_DRY_RUN=true`

This prevents on-chain token sends. Worker will not produce real signatures.

## 3) Stop Queued Payouts

Admin API path:
- `POST /api/admin/rewards/payout-jobs/{id}/cancel`

Bulk SQL option (safe operational mode):

```sql
update public.iv_payout_jobs
set status = 'canceled',
    locked_at = null,
    locked_by = null,
    updated_at = now()
where status in ('queued', 'failed');
```

Do not cancel `paid` rows.

## 4) Cancel A Specific Payout Job

1. Open admin rewards dashboard.
2. Find job by `id` in payout jobs table.
3. Use `Cancel` action.
4. Verify row status changed to `canceled`.

## 5) Detect Duplicate Payout Jobs

```sql
select privy_user_id, milestone_number, count(*)
from public.iv_payout_jobs
group by privy_user_id, milestone_number
having count(*) > 1;
```

Expected: zero rows.

## 6) Detect Duplicate Transaction Signatures

```sql
select signature, count(*)
from public.iv_payout_transactions
group by signature
having count(*) > 1;
```

Expected: zero rows.

## 7) Verify No Tokens Are Being Sent

1. Confirm env:
   - `IVT_PAYOUT_DRY_RUN=true`
   - `IVT_PAYOUT_WORKER_ENABLED=false` (preferred during incident)
2. Run one worker execution and confirm no real signature is persisted.
3. Query for new confirmed transactions after incident start time:

```sql
select id, payout_job_id, signature, status, created_at
from public.iv_payout_transactions
where created_at > now() - interval '15 minutes'
order by created_at desc;
```

Expected: no new real confirmed payout signatures while kill switch is active.

## 8) Resume Safely

1. Keep `IVT_PAYOUT_DRY_RUN=true`.
2. Re-enable worker once with limited scope.
3. Validate health endpoint and admin dashboard.
4. Validate queue and transactions consistency.
5. Only then set `IVT_PAYOUT_DRY_RUN=false` for controlled real payouts.

## 9) Emergency Rules

1. Never delete paid transaction records.
2. Never overwrite transaction signatures.
3. Never expose private keys in logs, code, or client bundles.
4. Never retry blindly after RPC uncertainty.
5. Verify chain state before marking failed/paid if confirmation is ambiguous.
