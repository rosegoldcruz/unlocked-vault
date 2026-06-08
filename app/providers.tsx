"use client"

import { PrivyProvider } from "@privy-io/react-auth"
import { PrivyTokenCookieBridge } from "@/components/auth/PrivyTokenCookieBridge"

export default function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

  if (!appId) {
    throw new Error("Missing required env var: NEXT_PUBLIC_PRIVY_APP_ID")
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email", "wallet"],
        appearance: {
          theme: "dark",
          accentColor: "#AAFF00",
        },
      }}
    >
      <PrivyTokenCookieBridge />
      <div className="min-h-screen bg-[#080808] text-zinc-100">{children}</div>
    </PrivyProvider>
  )
}
