"use client"

import { PrivyProvider } from "@privy-io/react-auth"
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana"
import { PrivyTokenCookieBridge } from "@/components/auth/PrivyTokenCookieBridge"

export default function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
  const solanaConnectors = toSolanaWalletConnectors({
    shouldAutoConnect: true,
  })

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
          walletChainType: "solana-only",
          walletList: ["phantom", "solflare", "detected_solana_wallets", "wallet_connect_qr_solana"],
        },
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
      }}
    >
      <PrivyTokenCookieBridge />
      <div className="min-h-screen bg-[#080808] text-zinc-100">{children}</div>
    </PrivyProvider>
  )
}
