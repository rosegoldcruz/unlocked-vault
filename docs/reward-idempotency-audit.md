# Reward Idempotency And Abuse Controls Audit

Date: 2026-06-06

## Scope

This audit validates abuse controls and idempotency across access, education progress, reward milestones, payout queueing, and payout execution paths.

## Checklist Results

1. Dashboard protected server-side: PASS
2. Invite redemption idempotent: PASS (server flow checks existing active entitlement before issuing new grant)
3. Stripe entitlement idempotent: PASS (grant logic keyed by user/payment and avoids duplicate active grants)
4. Education progress ignores client userId: PASS
5. Module completion idempotent: PASS (`iv_module_completions` unique by `privy_user_id,module_number`)
6. Milestones idempotent: PASS (`iv_reward_milestones` unique by `privy_user_id,milestone_number`)
7. Payout jobs idempotent: PASS (`iv_payout_jobs` unique by `privy_user_id,milestone_number`)
8. Transactions unique by signature and job: PASS (`unique(payout_job_id)` and `unique(signature)`)
9. Worker cannot pay paid/canceled jobs: PASS (worker selects and locks only queued jobs)
10. Dry-run cannot mark paid with fake signature: PASS (dry-run path marks failed with reason and stores no signature)
11. No service role in client code: PASS (service role usage remains server-side)
12. No private key in client code: PASS
13. No token/secret logs: PASS after removing token metadata logs in `lib/backoffice-client.ts`

## Patch Applied During Audit

- Removed token metadata logs from `lib/backoffice-client.ts`.

## Residual Risk

- Runtime env misconfiguration can still block payout execution.
- External RPC instability can delay confirmations; worker keeps bounded retry/backoff and explicit failure states.
