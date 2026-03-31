import { SignUp } from "@clerk/nextjs"
import { clerkAppearance } from "@/lib/clerk-appearance"
import { StarField } from "@/components/StarField"
import { AuthBrand } from "@/components/auth/AuthBrand"

export default function SignUpPage() {
  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden"
      style={{ background: "#0a0e1a" }}
    >
      <StarField count={80} />
      <div
        className="relative flex flex-col items-center gap-8"
        style={{ zIndex: 10, width: "100%", maxWidth: "380px" }}
      >
        <AuthBrand tagline="Create your account" />
        <SignUp appearance={clerkAppearance} />
      </div>
    </main>
  )
}
