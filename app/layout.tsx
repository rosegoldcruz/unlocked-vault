import { ClerkProvider } from "@clerk/nextjs"
import type { Metadata } from "next"
import Providers from "./providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "Iron Vault - Member Academy",
  description: "Member access to the full Iron Vault financial education curriculum.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full bg-[#080808] text-zinc-100">
      <body className="min-h-screen bg-[#080808] text-zinc-100">
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#aaff00",
              colorBackground: "#080808",
              colorForeground: "#f4f4f5",
              colorInput: "#101010",
              colorInputForeground: "#f4f4f5",
              borderRadius: "0.375rem",
            },
            elements: {
              card: "border border-[#1a1a1a] bg-[#0f0f0f] shadow-none",
              formButtonPrimary: "bg-[#aaff00] text-[#080808] hover:bg-[#c2ff3d]",
              footerActionLink: "text-[#aaff00] hover:text-[#c2ff3d]",
            },
          }}
        >
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  )
}
