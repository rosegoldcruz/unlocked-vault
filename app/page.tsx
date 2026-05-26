"use client"

import IronVaultAcademyUnlocked from "@/iron-vault-academy-unlocked"

/**
 * member.ironvaulttoken.com — founding member / existing investor academy.
 * No payment wall. All 6 modules unlocked immediately after Privy login.
 */
export default function MemberPage() {
  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#080808",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            background: "#0F0F0F",
            border: "1px solid rgba(123,47,190,0.3)",
            borderRadius: 6,
            padding: "48px 40px",
            textAlign: "center",
            color: "#fff",
          }}
        >
          <p
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: 3,
              color: "#AAFF00",
              marginBottom: 16,
            }}
          >
            ▸ SETUP REQUIRED
          </p>
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>Missing NEXT_PUBLIC_PRIVY_APP_ID</h1>
          <p style={{ fontSize: 14, color: "#555", lineHeight: 1.7 }}>
            Add your Privy App ID to the environment variables in Vercel and redeploy.
          </p>
        </div>
      </main>
    )
  }

  return <IronVaultAcademyUnlocked />
}
