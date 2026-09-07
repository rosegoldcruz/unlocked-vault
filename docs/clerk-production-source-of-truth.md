# Clerk Production Source of Truth

Updated: 2026-09-05

Iron Vault production uses one Clerk application:

- Application: `app_3InRR2DhLWHDxfI8KIXDozCfc15` (`IVSOL`)
- Production instance: `ins_3InTly1izVbRsGQBb8R9I9QBpD4`
- Frontend API: `clerk.ironvaulttoken.com`
- Account Portal: `accounts.ironvaulttoken.com`
- Vercel projects: `v0-modern-web3` and `unlocked-vault`
- Required key classes: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_*` and `CLERK_SECRET_KEY=sk_live_*`

Both Production and Preview scopes in both Vercel projects use this exact Production instance. `CLERK_PUBLIC_KEY` is unused and has been removed. The public UI exposes one Sign In entry point; Clerk's `withSignUp` flow handles new-account creation from that entry point.

Customer entitlements remain keyed by `privy_user_id`. `iv_auth_identity_links` maps each Production Clerk user ID to the pre-existing `privy_user_id`; entitlement, Academy, reward, and progress rows are not duplicated during Clerk migration.

The old `real-gorilla-333` Development instance is inactive and must not be used by a production or preview deployment. Clerk provisions Development and Production as instances of one application and exposes no operation for deleting only the Development instance. Deleting its parent application would also delete Production IVSOL, so the instance is intentionally retained but unused.

The separate zero-user `above-sloth-2733` application was deleted after production E2E passed.

The successful normal redemption response from `/api/access/redeem-invite` is HTTP 200. `AUTOMATION-FUN`, normal invite redemption, signed-out rejection, invalid-code rejection, existing migrated access, Academy access, and sign-out/sign-in persistence were verified against production after cutover.

Restricted rollback exports are stored outside the repository at `/root/.codex/attachments/2774e3b8-c3fc-463a-af54-2812b0dcacc1/clerk-consolidation-rollback-20260905`.
