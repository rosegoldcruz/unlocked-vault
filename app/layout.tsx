import { ClerkProvider } from "@clerk/nextjs"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Instrument_Serif, Inter_Tight } from "next/font/google"
import Providers from "./providers"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" })
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight", display: "swap" })
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Iron Vault - Member Academy",
  description: "Member access to the full Iron Vault financial education curriculum.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} ${interTight.variable} ${instrumentSerif.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('iv-theme');if(t!=='light'&&t!=='dark')t='dark';document.documentElement.dataset.ivTheme=t;document.documentElement.style.colorScheme=t}catch(e){}})()",
          }}
        />
      </head>
      <body>
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#8b6cff",
              colorBackground: "#111319",
              colorForeground: "#f4f4f5",
              colorInput: "#0b0c11",
              colorInputForeground: "#f4f4f5",
              borderRadius: "0.875rem",
            },
            elements: {
              card: "border border-white/10 bg-[#111319] shadow-none",
              formButtonPrimary: "bg-[#8b6cff] text-white hover:bg-[#7659e9]",
              footerActionLink: "text-[#b8a7ff] hover:text-white",
            },
          }}
        >
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  )
}
