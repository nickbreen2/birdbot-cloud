import { SignUp } from "@clerk/nextjs"
import { clerkAppearance } from "@/lib/clerk-appearance"
import { AuthBrand } from "@/components/auth/AuthBrand"

export default function SignUpPage() {
  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center p-6"

    >
      <div
        className="flex flex-col items-center gap-8"
        style={{ width: "100%", maxWidth: "440px" }}
      >
        <AuthBrand />
        <SignUp appearance={clerkAppearance} forceRedirectUrl="/dashboard" />
      </div>
    </main>
  )
}
