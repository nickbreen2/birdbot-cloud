# Privacy Policy Page — Design Spec

**Date:** 2026-04-06
**Status:** Approved

---

## Overview

Add a Privacy Policy page to BirdBot.ai, accessible via the "Privacy" link in the footer. The page is a static Next.js route styled to match the app's dark aesthetic. It covers the current early access phase of the product and explicitly notes that a full revision will be published at general launch.

---

## Approach

Static Next.js page (`.tsx`) with hardcoded content. No MDX, no CMS. Content is structured as JSX with styled headings and body text. Mirrors the Terms of Service page exactly in layout and styling — same Navbar, Footer, content column width, Early Access Notice box, and numbered section format.

---

## Page Design

- **Route:** `/privacy`
- **File:** `src/app/privacy/page.tsx`
- **Style:** Dark-themed, full-width page matching app aesthetic. Max-width content column (prose width), numbered section headings, body text in sans font, "Last updated" date at top.
- **Footer link:** Already wired — `FOOTER_HREFS["Privacy"] = "/privacy"` in Footer.tsx. No Footer changes required.

---

## Content Sections

### Early Access Notice *(prominent placement near top, same blue callout box as Terms)*

BirdBot.ai is currently in early access. This Privacy Policy is provisional and will be replaced with a full revision at general launch. Users will be notified of material changes by email.

---

### 1. What This Policy Covers

This Privacy Policy explains how BirdBot.ai collects, uses, and shares information when you use our platform. It applies to birdbot.ai and the BirdBot.ai agent service. This policy is provisional for the current early access phase and will be updated at general launch.

### 2. Information We Collect

- **Account information:** Your name and email address, collected via Clerk when you sign up or sign in.
- **Agent configuration:** The settings, instructions, and preferences you provide when setting up your AI agent (e.g., agent name, personality, model selection).
- **Usage data:** How you interact with the platform — including agent tasks run, models selected, and features used.
- **Technical data:** IP address, browser type, device type, and session information, collected automatically when you use the service.

### 3. How We Use Your Information

We use your information to:
- Provide and operate the BirdBot.ai service
- Improve and develop the platform
- Send you important account and service-related emails
- Process payments (when billing becomes active — not yet live)
- Respond to your support requests

### 4. Who We Share Your Information With

We do not sell your personal data.

We share data with the following third-party service providers:

- **Clerk** — handles authentication. Processes your name and email when you sign in or sign up. See [Clerk's Privacy Policy](https://clerk.com/privacy).
- **AI providers** — when your agent runs a task, your prompts and instructions are sent to the AI provider you have selected. Depending on your model choice, this may be:
  - Moonshot AI (via OpenRouter) — Kimi K2.5
  - OpenAI — GPT-4o
  - Anthropic — Claude Sonnet 4, Claude Opus 4
  - Google DeepMind — Gemini 2.5 Pro
  - DeepSeek — DeepSeek R1

  Each provider has their own privacy policy governing how they handle this data.
- **Stripe** — will process payment and billing information when billing goes live. Not yet active.

### 5. Data Retention

We retain your personal data for as long as your account is active. If you close your account, we will delete your personal data within a reasonable timeframe. Some data may be retained for legal or operational reasons as required.

### 6. Your Rights

You have the right to:
- Access the personal data we hold about you
- Request correction of inaccurate data
- Request deletion of your data

To exercise any of these rights, contact us at support@birdbot.ai.

### 7. Third-Party Links & Integrations

When your agent connects to external services (such as Slack, Discord, GitHub, or Telegram), those services collect and handle data under their own privacy policies. BirdBot.ai is not responsible for the privacy practices of third-party services.

### 8. Changes to This Policy

We may update this Privacy Policy at any time. Continued use of BirdBot.ai after changes are posted constitutes acceptance of the updated policy. For material changes, we will notify you by email.

### 9. Contact

Questions or concerns about this Privacy Policy? Contact us at support@birdbot.ai.

---

## Out of Scope (this spec)

- Cookie consent banner
- GDPR / CCPA compliance clauses (deferred until LLC is formed and jurisdiction determined)
- Analytics / tracking disclosures (no analytics in first version)
- Data Processing Agreements (DPAs) with AI providers (deferred to general launch)

---

## Implementation Notes

- Create `src/app/privacy/page.tsx` as a static server component
- Mirror Terms page structure exactly: `<div className="min-h-screen bg-depth">` → `<Navbar />` → `<main className="max-w-3xl mx-auto px-6 pt-36 pb-24">` → `<Footer />`
- Same Early Access Notice box (blue-tinted callout)
- Same numbered section heading style (`font-heading font-semibold text-lg text-text-base`)
- Same body text style (`text-sm font-sans text-text-dim leading-relaxed`)
- External links (Clerk privacy policy) use `className="text-blue-bright underline"`
- mailto links use `className="text-blue-bright underline"`
- No changes to Footer.tsx required
