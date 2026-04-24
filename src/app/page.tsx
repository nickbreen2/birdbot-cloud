import { Navbar } from "@/components/landing/Navbar"
import { HeroSection } from "@/components/landing/HeroSection"
import { ConversationDemo } from "@/components/landing/ConversationDemo"
import { WhyBirdBot } from "@/components/landing/WhyBirdBot"
import { FeaturesSection } from "@/components/landing/FeaturesSection"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { PricingSection } from "@/components/landing/PricingSection"
import { WaitlistCTA } from "@/components/landing/WaitlistCTA"
import { Footer } from "@/components/landing/Footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <ConversationDemo />
      <WhyBirdBot />
      <FeaturesSection />
      <HowItWorks />
      <PricingSection />
      <WaitlistCTA />
      <Footer />
    </main>
  )
}
