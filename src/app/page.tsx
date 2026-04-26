import { Navbar } from "@/components/landing/Navbar"
import { HeroSection } from "@/components/landing/HeroSection"
import { ConversationDemo } from "@/components/landing/ConversationDemo"
import { UseCasesSection } from "@/components/landing/UseCasesSection"
import { HowItWorksSection } from "@/components/landing/HowItWorksSection"
import { FAQSection } from "@/components/landing/FAQSection"
import { WaitlistCTA } from "@/components/landing/WaitlistCTA"
import { Footer } from "@/components/landing/Footer"

export default function Home() {
  return (
    <main className="min-h-screen">
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
