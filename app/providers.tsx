"use client"

import { PrivyProvider } from "@privy-io/react-auth"

export default function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

  // Avoid a runtime crash when env vars are missing in preview/production.
  if (!appId) {
    return <>{children}</>
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
      {children}
    </PrivyProvider>
  )
}
