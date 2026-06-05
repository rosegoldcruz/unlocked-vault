# Member Invite Access

This document describes invite redemption for the member portal.

## Endpoint

- Method: `POST`
- Path: `/api/access/redeem-invite`
- Auth: Privy bearer token (`Authorization: Bearer <token>`)

Request body:

```json
{
  "inviteCode": "YOUR-CODE"
}
```

## Behavior

- Validates authenticated Privy user on the server.
- Rejects missing invite code with `400`.
- Returns `200` with `already_entitled` when the account already has active member access.
- Returns `200` with `already_redeemed` when the invite was already redeemed by the same account.
- Returns `404` for unknown invite code.
- Returns `403` when invite identity constraints do not match the signed-in account.
- Returns `409` when invite is inactive, expired, or at max uses.
- Creates an `iv_member_entitlements` row with source `invite` for successful redemption.
- Increments `iv_member_invites.used_count` and flips invite status to `used` when the max use count is reached.
- Returns `201` with `redeemed` on success.

## UI Flow

- Blocked users can open `/redeem-invite` from `/access-required`.
- Redeem page requests login if needed, submits invite code, and redirects to `/dashboard` on success.
