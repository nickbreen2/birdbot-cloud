// Clerk v7 accesses `window` at module level (useInternalNavFun.js) without an
// SSR guard, which breaks Next.js static prerendering. All pages here require
// runtime auth state anyway, so force-dynamic is correct.
export const dynamic = 'force-dynamic'

import type { Metadata } from "next"
import { Outfit, DM_Sans, Fraunces, JetBrains_Mono, Bricolage_Grotesque } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { StarField } from "@/components/StarField"
import { ThemeProviderWrapper } from "@/components/ThemeProviderWrapper"
import "./globals.css"
import "./custom.css"

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

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500"],
})

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  weight: ["500", "600", "700"],
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.birdbot.ai"
  ),
  title: "BirdBot.ai — The AI Assistant That Lives in Your Messages",
  description:
    "BirdBot is the AI assistant that lives in your messages. Text it on Telegram and it remembers, takes notes, tracks what matters, and keeps you organized — 24/7.",
  keywords: [
    "AI assistant",
    "personal AI",
    "Claude AI",
    "Telegram AI bot",
    "AI memory",
    "knowledge graph",
    "AI notes",
    "BirdBot",
  ],
  icons: {
    icon: "/BirdBot-Icon-mark2.png",
    apple: "/BirdBot-Icon-mark2.png",
  },
  openGraph: {
    title: "BirdBot.ai — The AI Assistant That Lives in Your Messages",
    description:
      "Text BirdBot on Telegram and it remembers, takes notes, and keeps you organized — 24/7.",
    type: "website",
    url: "https://www.birdbot.ai",
    siteName: "BirdBot.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "BirdBot.ai — The AI Assistant That Lives in Your Messages",
    description:
      "Text BirdBot on Telegram and it remembers, takes notes, and keeps you organized — 24/7.",
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
      data-theme="landing"
      className={`${outfit.variable} ${dmSans.variable} ${fraunces.variable} ${jetbrainsMono.variable} ${bricolageGrotesque.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var d=["/dashboard","/demo"],p=window.location.pathname;if(!d.some(function(x){return p===x||p.startsWith(x+"/")}))return;var t=localStorage.getItem("theme")||"dark";if(t==="system")t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",t)}catch(e){}})();` }} />
      </head>
      <body className="min-h-full bg-depth text-text-base antialiased font-sans" suppressHydrationWarning>
        <ThemeProviderWrapper>
          <ClerkProvider signUpForceRedirectUrl="/onboarding" signInForceRedirectUrl="/dashboard">
            <StarField />
            <div className="relative" style={{ zIndex: 1 }}>
              {children}
            </div>
            <Analytics />
            <SpeedInsights />
          </ClerkProvider>
        </ThemeProviderWrapper>
      </body>
    </html>
  )
}
