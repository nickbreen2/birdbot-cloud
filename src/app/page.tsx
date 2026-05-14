import { Navbar } from "@/components/landing/Navbar"
import { HeroSection } from "@/components/landing/HeroSection"
import { ConversationDemo } from "@/components/landing/ConversationDemo"
import { UseCasesSection } from "@/components/landing/UseCasesSection"
import { HowItWorksSection } from "@/components/landing/HowItWorksSection"
import { FAQSection } from "@/components/landing/FAQSection"
import { WaitlistCTA } from "@/components/landing/WaitlistCTA"
import { Footer } from "@/components/landing/Footer"
<<<<<<< HEAD
import { LandingThemeLock } from "@/components/LandingThemeLock"
=======
>>>>>>> origin/main
import { ScrollOnMount } from "@/components/landing/ScrollOnMount"

export default function Home() {
  return (
<<<<<<< HEAD
    <main className="min-h-screen" data-theme="landing">
      <LandingThemeLock />
=======
    <main className="min-h-screen">
>>>>>>> origin/main
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
