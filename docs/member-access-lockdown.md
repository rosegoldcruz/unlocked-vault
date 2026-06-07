# Member Access Lockdown

## Current access rule

Member routes are protected by `requireMemberAccess()`. A verified Privy session is required, and non-admin users must have an active, unexpired row in `iv_member_entitlements`.

`iv_user_profiles.role = MEMBER` does not grant access by itself. `ADMIN` users may bypass entitlement checks.

## Grandfather cutoff rule

Existing profile users created at or before `GRANDFATHER_CUTOFF_ISO` may be granted a `grandfathered` entitlement. Future Privy account creation alone does not grant academy or dashboard access.

The current cutoff for the lockdown run is:

```text
2026-06-06T23:59:59.000Z
```

## Dry run

Run a dry run before writing any entitlements:

```powershell
$env:GRANDFATHER_CUTOFF_ISO="2026-06-06T23:59:59.000Z"
npm run members:grandfather:dry-run
```

The dry run reports counts only: cutoff, users found, already entitled, would grandfather, skipped, and errors.

## Apply

Apply only after the dry-run counts look correct:

```powershell
$env:GRANDFATHER_CUTOFF_ISO="2026-06-06T23:59:59.000Z"
npm run members:grandfather:apply
```

The script inserts `iv_member_entitlements` rows with `source = 'grandfathered'`, `status = 'active'`, and `granted_by = 'system:grandfather-existing-privy-users'`.

## Verify new users are blocked

Create or use a Privy user that has no active `iv_member_entitlements` row and is not an admin. After login, `/api/access/me` should return `403`, and the UI should land on `/access-required`.

## Stripe access

Stripe-paid users should receive an active `iv_member_entitlements` row with `source = 'stripe'`. Once that row exists and is not expired, `requireMemberAccess()` grants access.

## Invite access

Invite redemption uses `/api/access/redeem-invite`. A valid invite creates an active `iv_member_entitlements` row with `source = 'invite'`, tied to the current verified Privy identity.

## Emergency rollback

Do not delete users. Do not delete paid or invite audit rows.

To revoke an incorrectly granted entitlement, set that entitlement row's `status` to `revoked`. This preserves history while removing access.
