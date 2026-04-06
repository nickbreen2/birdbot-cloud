import type { Metadata } from "next"
import { Outfit, DM_Sans } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { StarField } from "@/components/StarField"
import "./globals.css"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700"],
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://birdbot.ai"
  ),
  title: "BirdBot.ai — Your Personal AI Agent, Always On",
  description:
    "Deploy your own AI agent in seconds. BirdBot automates tasks, browses the web, manages files, and connects to Telegram and your favorite apps — running 24/7, no setup required.",
  keywords: [
    "AI agent",
    "personal AI assistant",
    "Claude AI",
    "autonomous agent",
    "AI automation",
    "Telegram AI bot",
    "managed AI",
    "BirdBot",
  ],
  icons: {
    icon: "/BirdBot-Icon-mark1.png",
    apple: "/BirdBot-Icon-mark1.png",
  },
  openGraph: {
    title: "BirdBot.ai — Your Personal AI Agent, Always On",
    description:
      "Deploy your own AI agent in seconds. Automates tasks, browses the web, connects to your apps — running 24/7.",
    type: "website",
    url: "https://birdbot.ai",
    siteName: "BirdBot.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "BirdBot.ai — Your Personal AI Agent, Always On",
    description:
      "Deploy your own AI agent in seconds. Automates tasks, browses the web, connects to your apps — running 24/7.",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${dmSans.variable} h-full`}
    >
      <body className="min-h-full bg-depth text-text-base antialiased font-sans" suppressHydrationWarning>
        <ClerkProvider>
          <StarField />
          <div className="relative" style={{ zIndex: 1 }}>
            {children}
          </div>
          <Analytics />
          <SpeedInsights />
        </ClerkProvider>
      </body>
    </html>
  )
}
