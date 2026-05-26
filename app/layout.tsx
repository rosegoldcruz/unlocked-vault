import type { Metadata } from "next"
import { PrivyProvider } from "@privy-io/react-auth"

export const metadata: Metadata = {
  title: "Iron Vault — Member Academy",
  description: "Founding member access to the full Iron Vault financial education curriculum.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PrivyProvider
          appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
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
      </body>
    </html>
  )
}
