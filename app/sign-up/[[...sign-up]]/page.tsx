import { SignUp } from "@clerk/nextjs"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SignUpPage() {
  return (
    <main className="iv-member-shell grid min-h-screen place-items-center px-4 py-8">
      <div className="iv-member-ambient" aria-hidden>
        <div className="iv-member-ambient-glow" />
        <div className="iv-member-dot-pattern" />
        <div className="iv-member-flickering-grid" />
      </div>
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/" />
    </main>
  )
}
