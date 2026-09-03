# Iron Vault Member Academy

Member / existing investor access portal.  
**All 6 modules unlocked** — no payment wall.

Live at → `member.ironvaulttoken.com`

---

## Setup

```bash
npm install
cp .env.example .env.local
# add Clerk auth keys and Supabase service credentials to .env.local
npm run dev
```

## Deploy (Vercel)

1. Push this repo to GitHub
2. Import into Vercel as a new project
3. Add Clerk authentication variables for app `app_3InRR2DhLWHDxfI8KIXDozCfc15`
4. In Vercel Domains, connect `member.ironvaulttoken.com` to this project

## Structure

| File | Purpose |
|---|---|
| `iron-vault-academy-unlocked.jsx` | Main academy component (all modules unlocked) |
| `app/page.tsx` | Entry point — renders the academy |
| `app/layout.tsx` | Wraps app with Clerk auth provider |

## How it differs from `/learn` (gated version)

| | `/learn` (gated) | `member.ironvaulttoken.com` (unlocked) |
|---|---|---|
| Payment check | ✅ Yes — `/api/check-payment` | ❌ None |
| Modules available | Only purchased ones | All 6 immediately |
| Banner | None | "MEMBER — ALL 6 MODULES UNLOCKED" |
| Sequential quiz lock | ✅ Yes | ✅ Yes |
| Audience | New investors | Members |
