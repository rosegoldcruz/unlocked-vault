"use client"

import { useMemo } from "react"
import { PrivyProvider, type PrivyClientConfig } from "@privy-io/react-auth"
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana"
import { PrivyTokenCookieBridge } from "@/components/auth/PrivyTokenCookieBridge"

export default function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

  if (!appId) {
    throw new Error("Missing required env var: NEXT_PUBLIC_PRIVY_APP_ID")
  }

  // Memoized so PrivyProvider always receives the same config/connector
  // object identity across re-renders of this tree. A fresh object on every
  // render risks Privy treating it as a config change and reinitializing the
  // SDK, which would tear down an in-progress login (e.g. mid OTP entry).
  const config = useMemo<PrivyClientConfig>(
    () => ({
      loginMethods: ["email", "wallet"],
      appearance: {
        theme: "dark",
        accentColor: "#AAFF00",
        walletChainType: "solana-only",
        walletList: ["phantom", "solflare", "detected_solana_wallets", "wallet_connect_qr_solana"],
      },
      externalWallets: {
        solana: {
          connectors: toSolanaWalletConnectors({
            shouldAutoConnect: true,
          }),
        },
      },
    }),
    [],
  )

  return (
    <PrivyProvider appId={appId} config={config}>
      <PrivyTokenCookieBridge />
      <div className="min-h-screen bg-[#080808] text-zinc-100">{children}</div>
    </PrivyProvider>
  )
}
