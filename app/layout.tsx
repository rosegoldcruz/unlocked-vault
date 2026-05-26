import type { Metadata } from "next"
import Providers from "./providers"

export const metadata: Metadata = {
  title: "Iron Vault - Member Academy",
  description: "Founding member access to the full Iron Vault financial education curriculum.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
