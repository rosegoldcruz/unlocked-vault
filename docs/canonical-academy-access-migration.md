# Canonical Academy Access Migration

## Migration map

| Existing structure | Classification | New behavior |
| --- | --- | --- |
| `iv_member_entitlements` identity/status/payment fields | Current access and fulfillment data | Retained; canonical package fields are backfilled and used for Academy authorization |
| `metadata.tier`, `legacy_tier`, `product_key`, and `payment_tier` | Historical/package evidence | Mapped to Entry-Level, Intermediate, Advanced, or Elite |
| `access_type`, `modulesToUnlock`, and `reward_track` | Legacy access/reward metadata | Retained for audit and rewards; no longer grants single-module core Academy access |
| `iv_payments`, presale, wallet, progress, and audit records | Payment/accounting/token/history | Retained unchanged |
| `iv_user_profiles.role` | Internal authorization | `ADMIN` remains server-side only and is never returned as a customer package |
| VIP/founder labels and old tier names | Historical metadata | Retained for audit; do not control ordinary core Academy access |

## Canonical rules

- Entry-Level: `FREE` core Academy and orientation only.
- Intermediate and Advanced: `FULL` core Academy with identical module access.
- Elite: `FULL` core Academy plus Developer Lab access.
- Token allocation remains separate from lesson authorization and continues through existing reward/payment metadata.

The migration is additive and does not delete or rewrite historical records. Production aggregate counts, unresolved identities, migration execution, deployment, and live smoke tests require the Supabase and deployment credentials, which were unavailable during this change.