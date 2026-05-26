# Iron Vault Member Academy

Founding member / existing investor access portal.  
**All 6 modules unlocked** — no payment wall.

Live at → `member.ironvaulttoken.com`

---

## Setup

```bash
npm install
cp .env.example .env.local
# add your NEXT_PUBLIC_PRIVY_APP_ID to .env.local
npm run dev
```

## Deploy (Vercel)

1. Push this repo to GitHub
2. Import into Vercel as a new project
3. Add environment variable: `NEXT_PUBLIC_PRIVY_APP_ID`
4. In Vercel Domains, connect `member.ironvaulttoken.com` to this project

## Structure

| File | Purpose |
|---|---|
| `iron-vault-academy-unlocked.jsx` | Main academy component (all modules unlocked) |
| `app/page.tsx` | Entry point — renders the academy |
| `app/layout.tsx` | Wraps app with Privy auth provider |

## How it differs from `/learn` (gated version)

| | `/learn` (gated) | `member.ironvaulttoken.com` (unlocked) |
|---|---|---|
| Payment check | ✅ Yes — `/api/check-payment` | ❌ None |
| Modules available | Only purchased ones | All 6 immediately |
| Banner | None | "FOUNDING MEMBER — ALL 6 MODULES UNLOCKED" |
| Sequential quiz lock | ✅ Yes | ✅ Yes |
| Audience | New investors | Founding members |
