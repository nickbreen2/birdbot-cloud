import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy — BirdBot.ai",
  description: "Privacy Policy for BirdBot.ai",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-depth">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 pt-36 pb-24">
        {/* Page header */}
        <div className="mb-10">
          <h1
            className="font-heading font-bold text-text-base mb-3"
            style={{ fontSize: "clamp(1.6rem, 4vw, 2.25rem)" }}
          >
            Privacy Policy
          </h1>
          <p className="text-text-muted text-sm font-sans">
            Last updated: April 6, 2026
          </p>
        </div>

        {/* Early Access Notice */}
        <div
          className="rounded-xl px-5 py-4 mb-10"
          style={{
            border: "1px solid rgba(59,130,246,0.30)",
            background: "rgba(59,130,246,0.06)",
          }}
        >
          <p className="text-sm font-sans font-semibold text-blue-bright mb-1.5">
            Early Access Notice
          </p>
          <p className="text-sm font-sans text-text-dim leading-relaxed">
            BirdBot.ai is currently in early access. This Privacy Policy is
            provisional and will be replaced with a full revision at general
            launch. Users will be notified of material changes by email.
          </p>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-9">

          {/* 1. What This Policy Covers */}
          <section>
            <h2 className="font-heading font-semibold text-lg text-text-base mb-2">
              1. What This Policy Covers
            </h2>
            <p className="text-sm font-sans text-text-dim leading-relaxed">
              This Privacy Policy explains how BirdBot.ai collects, uses, and
              shares information when you use our platform. It applies to
              birdbot.ai and the BirdBot.ai agent service. This policy is
              provisional for the current early access phase and will be updated
              at general launch.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section>
            <h2 className="font-heading font-semibold text-lg text-text-base mb-2">
              2. Information We Collect
            </h2>
            <ul className="flex flex-col gap-2">
              {(
                [
                  [
                    "Account information",
                    "Your name and email address, collected via Clerk when you sign up or sign in.",
                  ],
                  [
                    "Agent configuration",
                    "The settings, instructions, and preferences you provide when setting up your AI agent — including agent name, personality, and model selection.",
                  ],
                  [
                    "Usage data",
                    "How you interact with the platform, including agent tasks run, models selected, and features used.",
                  ],
                  [
                    "Technical data",
                    "IP address, browser type, device type, and session information, collected automatically when you use the service.",
                  ],
                ] as [string, string][]
              ).map(([label, desc]) => (
                <li
                  key={label}
                  className="flex items-start gap-2.5 text-sm font-sans text-text-dim leading-relaxed"
                >
                  <span
                    className="flex-shrink-0 mt-0.5"
                    style={{ color: "rgba(59,130,246,0.7)" }}
                  >
                    —
                  </span>
                  <span>
                    <span className="text-text-base font-medium">{label}:</span>{" "}
                    {desc}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* 3. How We Use Your Information */}
          <section>
            <h2 className="font-heading font-semibold text-lg text-text-base mb-2">
              3. How We Use Your Information
            </h2>
            <p className="text-sm font-sans text-text-dim leading-relaxed mb-3">
              We use your information to:
            </p>
            <ul className="flex flex-col gap-2">
              {[
                "Provide and operate the BirdBot.ai service.",
                "Improve and develop the platform.",
                "Send you important account and service-related emails.",
                "Process payments when billing becomes active (not yet live).",
                "Respond to your support requests.",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm font-sans text-text-dim leading-relaxed"
                >
                  <span
                    className="flex-shrink-0 mt-0.5"
                    style={{ color: "rgba(59,130,246,0.7)" }}
                  >
                    —
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* 4. Who We Share Your Information With */}
          <section>
            <h2 className="font-heading font-semibold text-lg text-text-base mb-2">
              4. Who We Share Your Information With
            </h2>
            <p className="text-sm font-sans text-text-dim leading-relaxed mb-3">
              We do not sell your personal data. We share data with the
              following third-party service providers:
            </p>
            <ul className="flex flex-col gap-2">
              <li className="flex items-start gap-2.5 text-sm font-sans text-text-dim leading-relaxed">
                <span
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: "rgba(59,130,246,0.7)" }}
                >
                  —
                </span>
                <span>
                  <span className="text-text-base font-medium">Clerk</span> —
                  handles authentication and processes your name and email when
                  you sign in or sign up.
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-sm font-sans text-text-dim leading-relaxed">
                <span
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: "rgba(59,130,246,0.7)" }}
                >
                  —
                </span>
                <span>
                  <span className="text-text-base font-medium">
                    AI providers
                  </span>{" "}
                  — when your agent runs a task, your prompts and instructions
                  are sent to the AI provider you have selected. Depending on
                  your model choice, this may be Moonshot AI via OpenRouter
                  (Kimi K2.5), OpenAI (GPT-4o), Anthropic (Claude Sonnet 4 or
                  Claude Opus 4), Google DeepMind (Gemini 2.5 Pro), or DeepSeek
                  (DeepSeek R1). Each provider has their own privacy policy
                  governing how they handle this data.
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-sm font-sans text-text-dim leading-relaxed">
                <span
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: "rgba(59,130,246,0.7)" }}
                >
                  —
                </span>
                <span>
                  <span className="text-text-base font-medium">Stripe</span> —
                  will process payment and billing information when billing goes
                  live. Not yet active.
                </span>
              </li>
            </ul>
          </section>

          {/* 5. Data Retention */}
          <section>
            <h2 className="font-heading font-semibold text-lg text-text-base mb-2">
              5. Data Retention
            </h2>
            <p className="text-sm font-sans text-text-dim leading-relaxed">
              We retain your personal data for as long as your account is
              active. If you close your account, we will delete your personal
              data within a reasonable timeframe. Some data may be retained for
              legal or operational reasons as required.
            </p>
          </section>

          {/* 6. Your Rights */}
          <section>
            <h2 className="font-heading font-semibold text-lg text-text-base mb-2">
              6. Your Rights
            </h2>
            <p className="text-sm font-sans text-text-dim leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="flex flex-col gap-2">
              {[
                "Access the personal data we hold about you.",
                "Request correction of inaccurate data.",
                "Request deletion of your data.",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm font-sans text-text-dim leading-relaxed"
                >
                  <span
                    className="flex-shrink-0 mt-0.5"
                    style={{ color: "rgba(59,130,246,0.7)" }}
                  >
                    —
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-sm font-sans text-text-dim leading-relaxed mt-3">
              To exercise any of these rights, contact us at{" "}
              <a
                href="mailto:support@birdbot.ai"
                className="text-blue-bright underline"
              >
                support@birdbot.ai
              </a>
              .
            </p>
          </section>

          {/* 7. Third-Party Links & Integrations */}
          <section>
            <h2 className="font-heading font-semibold text-lg text-text-base mb-2">
              7. Third-Party Links &amp; Integrations
            </h2>
            <p className="text-sm font-sans text-text-dim leading-relaxed">
              When your agent connects to external services such as Slack,
              Discord, GitHub, or Telegram, those services collect and handle
              data under their own privacy policies. BirdBot.ai is not
              responsible for the privacy practices of third-party services.
            </p>
          </section>

          {/* 8. Changes to This Policy */}
          <section>
            <h2 className="font-heading font-semibold text-lg text-text-base mb-2">
              8. Changes to This Policy
            </h2>
            <p className="text-sm font-sans text-text-dim leading-relaxed">
              We may update this Privacy Policy at any time. Continued use of
              BirdBot.ai after changes are posted constitutes acceptance of the
              updated policy. For material changes, we will notify you by email.
            </p>
          </section>

          {/* 9. Contact */}
          <section>
            <h2 className="font-heading font-semibold text-lg text-text-base mb-2">
              9. Contact
            </h2>
            <p className="text-sm font-sans text-text-dim leading-relaxed">
              Questions or concerns about this Privacy Policy? Reach us at{" "}
              <a
                href="mailto:support@birdbot.ai"
                className="text-blue-bright underline"
              >
                support@birdbot.ai
              </a>
              .
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  )
}
