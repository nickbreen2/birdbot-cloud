import type { Metadata } from "next"
import { Outfit, DM_Sans } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
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
  title: "BirdBot.ai — Your AI Assistant, Always On",
  description:
    "Deploy your personal AI agent in seconds. Automates tasks, browses the web, manages files, and connects to your apps — running 24/7, no setup required.",
  openGraph: {
    title: "BirdBot.ai — Your AI Assistant, Always On",
    description:
      "Deploy your personal AI agent in seconds. Starting at $19/month.",
    type: "website",
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
        <ClerkProvider
          appearance={{
            variables: {
              colorBackground: "#141a2c",
              colorInputBackground: "#0e1425",
              colorInputText: "#f1f5f9",
              colorText: "#f1f5f9",
              colorTextSecondary: "#94a3b8",
              colorPrimary: "#2563eb",
              colorDanger: "#ef4444",
              borderRadius: "0.75rem",
              fontFamily: "var(--font-dm-sans)",
            },
          }}
        >
          <StarField />
          <div className="relative" style={{ zIndex: 1 }}>
            {children}
          </div>
        </ClerkProvider>
      </body>
    </html>
  )
}
