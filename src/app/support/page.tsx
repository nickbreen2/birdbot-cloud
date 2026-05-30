import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { LandingThemeLock } from "@/components/LandingThemeLock"
import Image from "next/image"
import type { Metadata } from "next"
import { EmailBox } from "./EmailBox"

export const metadata: Metadata = {
  title: "Support — BirdBot.ai",
  description: "Get support from the BirdBot.ai team.",
  alternates: {
    canonical: "/support",
  },
}

export default function SupportPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingThemeLock />
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24">
        <div className="flex flex-col items-center gap-6 w-full max-w-sm text-center">
          {/* Illustration */}
          <Image
            src="/download (1).gif"
            alt="Support illustration"
            width={200}
            height={200}
            unoptimized
            style={{ height: "auto", width: "200px" }}
          />

          {/* Heading + subtext */}
          <div className="flex flex-col gap-2">
            <h1
              className="font-heading font-bold text-text-base"
              style={{ fontSize: "clamp(1.6rem, 4vw, 2.25rem)" }}
            >
              Get Support
            </h1>
            <p className="text-sm font-sans text-text-dim leading-relaxed">
              Have a question or ran into an issue? Drop us a line and we&apos;ll
              get back to you.
            </p>
          </div>

          {/* Email box */}
          <EmailBox />
        </div>
      </main>

      <Footer />
    </div>
  )
}
