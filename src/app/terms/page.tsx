import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service — BirdBot.ai",
  description: "Terms of Service for BirdBot.ai",
}

export default function TermsPage() {
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
            Terms of Service
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
            BirdBot.ai is currently in early access. Features are actively
            evolving and may change, be added, or removed without prior notice.
            These Terms are provisional and will be replaced with a full revision
            at general launch. Users will be notified of material changes by
            email.
          </p>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-9">

          {/* 1. Acceptance */}
          <section>
            <h2 className="font-heading font-semibold text-lg text-text-base mb-2">
              1. Acceptance of Terms
            </h2>
            <p className="text-sm font-sans text-text-dim leading-relaxed">
              By accessing or using BirdBot.ai, you agree to be bound by these
              Terms of Service. If you do not agree to these Terms, please do not
              use the service.
            </p>
          </section>

          {/* 2. Description of Service */}
          <section>
            <h2 className="font-heading font-semibold text-lg text-text-base mb-2">
              2. Description of Service
            </h2>
            <p className="text-sm font-sans text-text-dim leading-relaxed">
              BirdBot.ai is a personal AI agent platform. It allows users to
              deploy AI agents that can automate tasks, browse the web, manage
              files, and connect to third-party applications. The service is
              currently available on a limited early access basis.
            </p>
          </section>

          {/* 3. Account Registration */}
          <section>
            <h2 className="font-heading font-semibold text-lg text-text-base mb-2">
              3. Account Registration
            </h2>
            <ul className="flex flex-col gap-2">
              {[
                "You must be at least 18 years old to create an account.",
                "You agree to provide accurate and complete information when registering.",
                "You are responsible for maintaining the security of your login credentials.",
                "You are responsible for all activity that occurs under your account.",
                "Only one account per person is permitted.",
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

          {/* 4. Acceptable Use */}
          <section>
            <h2 className="font-heading font-semibold text-lg text-text-base mb-2">
              4. Acceptable Use
            </h2>
            <p className="text-sm font-sans text-text-dim leading-relaxed mb-3">
              You agree not to use BirdBot.ai to:
            </p>
            <ul className="flex flex-col gap-2">
              {[
                "Violate any applicable laws or regulations.",
                "Harm, harass, stalk, or deceive other people.",
                "Generate illegal, abusive, or harmful content via your agent.",
                "Attempt to reverse-engineer, hack, or disrupt the platform or its infrastructure.",
                "Use your agent for mass spam, unauthorized data scraping, or DDoS-style automation.",
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

          {/* 5. AI Disclaimer */}
          <section>
            <h2 className="font-heading font-semibold text-lg text-text-base mb-2">
              5. AI Disclaimer
            </h2>
            <p className="text-sm font-sans text-text-dim leading-relaxed">
              AI outputs are not guaranteed to be accurate, complete, or
              error-free. BirdBot.ai is not responsible for decisions you make
              based on AI-generated output, or for actions taken by your agent on
              your behalf. You are responsible for reviewing your agent&apos;s
              actions, particularly when it interacts with external services.
            </p>
          </section>

          {/* 6. Subscription & Payments */}
          <section>
            <h2 className="font-heading font-semibold text-lg text-text-base mb-2">
              6. Subscription &amp; Payments
            </h2>
            <p className="text-sm font-sans text-text-dim leading-relaxed">
              BirdBot.ai offers Lite ($19/mo), Pro ($39/mo), and Max ($79/mo)
              plans as described on the site. Billing is not yet active. Full
              payment terms — including billing cycles and refund policy — will be
              provided at general launch. When billing goes live, a
              cancel-anytime policy will apply and users will be notified in
              advance.
            </p>
          </section>

          {/* 7. Privacy & Data */}
          <section>
            <h2 className="font-heading font-semibold text-lg text-text-base mb-2">
              7. Privacy &amp; Data
            </h2>
            <p className="text-sm font-sans text-text-dim leading-relaxed">
              How we collect, store, and use your data is described in our{" "}
              <a
                href="/privacy"
                className="text-blue-bright underline"
              >
                Privacy Policy
              </a>
              . By using BirdBot.ai you agree to that policy.
            </p>
          </section>

          {/* 8. Intellectual Property */}
          <section>
            <h2 className="font-heading font-semibold text-lg text-text-base mb-2">
              8. Intellectual Property
            </h2>
            <p className="text-sm font-sans text-text-dim leading-relaxed">
              The BirdBot.ai platform, branding, logo, and code are owned by
              BirdBot.ai. You retain ownership of your own content and data. By
              using the service, you grant BirdBot.ai a limited, non-exclusive
              license to process your data solely for the purpose of providing
              the service to you.
            </p>
          </section>

          {/* 9. Third-Party Integrations */}
          <section>
            <h2 className="font-heading font-semibold text-lg text-text-base mb-2">
              9. Third-Party Integrations
            </h2>
            <p className="text-sm font-sans text-text-dim leading-relaxed">
              Your agent may connect to third-party services including Slack,
              Discord, GitHub, and Telegram. BirdBot.ai is not responsible for
              the behavior, availability, or policies of those services. You must
              comply with each third party&apos;s own terms of service when using
              integrations.
            </p>
          </section>

          {/* 10. Limitation of Liability */}
          <section>
            <h2 className="font-heading font-semibold text-lg text-text-base mb-2">
              10. Limitation of Liability
            </h2>
            <p className="text-sm font-sans text-text-dim leading-relaxed">
              The service is provided &ldquo;as is&rdquo; without warranties of
              any kind. BirdBot.ai makes no guarantees regarding uptime, accuracy,
              or availability. To the fullest extent permitted by law, BirdBot.ai
              is not liable for any direct, indirect, incidental, or consequential
              damages arising from your use of the platform or actions taken by
              your AI agent.
            </p>
          </section>

          {/* 11. Indemnification */}
          <section>
            <h2 className="font-heading font-semibold text-lg text-text-base mb-2">
              11. Indemnification
            </h2>
            <p className="text-sm font-sans text-text-dim leading-relaxed">
              You agree to indemnify and hold BirdBot.ai harmless from any
              claims, damages, or expenses (including reasonable legal fees)
              arising out of your use of the platform, your violation of these
              Terms, or your violation of any third-party rights.
            </p>
          </section>

          {/* 12. Termination */}
          <section>
            <h2 className="font-heading font-semibold text-lg text-text-base mb-2">
              12. Termination
            </h2>
            <p className="text-sm font-sans text-text-dim leading-relaxed">
              BirdBot.ai may suspend or terminate your account at any time for
              violations of these Terms. You may close your account at any time
              by contacting{" "}
              <a
                href="mailto:support@birdbot.ai"
                className="text-blue-bright underline"
              >
                support@birdbot.ai
              </a>
              .
            </p>
          </section>

          {/* 13. Changes to Terms */}
          <section>
            <h2 className="font-heading font-semibold text-lg text-text-base mb-2">
              13. Changes to Terms
            </h2>
            <p className="text-sm font-sans text-text-dim leading-relaxed">
              We may update these Terms at any time. Continued use of BirdBot.ai
              after changes are posted constitutes acceptance of the updated
              Terms. For material changes, we will notify you by email.
            </p>
          </section>

          {/* 14. Contact */}
          <section>
            <h2 className="font-heading font-semibold text-lg text-text-base mb-2">
              14. Contact
            </h2>
            <p className="text-sm font-sans text-text-dim leading-relaxed">
              Questions or concerns about these Terms? Reach us at{" "}
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
