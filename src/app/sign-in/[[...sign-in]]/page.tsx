'use client'
import { AuthBrand } from '@/components/auth/AuthBrand'
import { SignInForm } from '@/components/auth/SignInForm'

export default function SignInPage() {
  return (
    <main className="relative flex flex-col sm:min-h-screen sm:items-center sm:justify-center sm:p-6">
      <div className="flex flex-col sm:items-center sm:gap-8 w-full sm:max-w-[440px]">

        <div className="hidden sm:flex justify-center">
          <AuthBrand />
        </div>

        <div className="auth-card min-h-screen sm:min-h-0 w-full p-6 sm:p-8 flex flex-col justify-center sm:justify-start gap-5 sm:gap-6">
          <div className="sm:hidden flex justify-center mb-1">
            <AuthBrand />
          </div>
          <SignInForm />
        </div>

      </div>
    </main>
  )
}
