import type { Metadata } from "next"
import Providers from "./providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "Iron Vault - Member Academy",
  description: "Member access to the full Iron Vault financial education curriculum.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full bg-slate-950 text-slate-50">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
