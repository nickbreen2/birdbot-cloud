import type { Metadata } from "next"
import { Navbar } from "@/components/landing/Navbar"
import { HeroSection } from "@/components/landing/HeroSection"
import { ConversationDemo } from "@/components/landing/ConversationDemo"
import { UseCasesSection } from "@/components/landing/UseCasesSection"
import { HowItWorksSection } from "@/components/landing/HowItWorksSection"
import { FAQSection } from "@/components/landing/FAQSection"
import { WaitlistCTA } from "@/components/landing/WaitlistCTA"
import { Footer } from "@/components/landing/Footer"
import { LandingThemeLock } from "@/components/LandingThemeLock"
import { ScrollOnMount } from "@/components/landing/ScrollOnMount"

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
}

export default function Home() {
  return (
    <main className="min-h-screen" data-theme="landing">
      <LandingThemeLock />
      <ScrollOnMount />
      <Navbar />
      <HeroSection />
      <ConversationDemo />
      <UseCasesSection />
      <HowItWorksSection />
      <FAQSection />
      <WaitlistCTA />
      <Footer />
    </main>
  )
}
