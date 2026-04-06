# Terms and Conditions Page — Design Spec

**Date:** 2026-04-06
**Status:** Approved

---

## Overview

Add a Terms and Conditions page to BirdBot.ai, accessible via the "Terms" link in the footer. The page is a static Next.js route styled to match the app's dark aesthetic. It covers the current early access phase of the product and explicitly notes that a full revision will be published at general launch.

---

## Approach

Static Next.js page (`.tsx`) with hardcoded content. No MDX, no CMS. Content is structured as JSX with styled headings and body text. Easy to update via code; suits the low-change cadence of legal pages.

---

## Page Design

- **Route:** `/terms`
- **Style:** Dark-themed, full-width page matching app aesthetic. Max-width content column (prose width), section headings, body text in sans font, "Last updated" date at top.
- **Footer link:** "Terms" in the footer nav updates from `href="#"` to `href="/terms"`.

---

## Content Sections

### 1. Introduction / Acceptance of Terms
By accessing or using BirdBot.ai, you agree to be bound by these Terms of Service. If you do not agree, please do not use the service.

### 2. Early Access Notice *(prominent placement near top)*
BirdBot.ai is currently in early access. Features are actively evolving and may change, be added, or removed without notice. These Terms are provisional and will be replaced with a full revision at general launch. Users will be notified of material changes by email.

### 3. Description of Service
BirdBot.ai is a personal AI agent platform. It allows users to deploy AI agents that can automate tasks, browse the web, manage files, and connect to third-party applications. The service is currently available on a limited early access basis.

### 4. Account Registration
- You must be at least 18 years old to create an account.
- You agree to provide accurate information when registering.
- You are responsible for maintaining the security of your credentials.
- You are responsible for all activity that occurs under your account.
- One account per person.

### 5. Acceptable Use
You agree not to use BirdBot.ai to:
- Violate any applicable laws or regulations
- Harm, harass, or deceive other people
- Generate illegal, abusive, or harmful content via your agent
- Attempt to reverse-engineer, hack, or disrupt the platform
- Use your agent for mass spam, unauthorized data scraping, or DDoS-style automation

### 6. AI Disclaimer
AI outputs are not guaranteed to be accurate, complete, or error-free. BirdBot.ai is not responsible for decisions you make based on AI-generated output, or for actions taken by your agent on your behalf. You are responsible for reviewing your agent's actions, particularly when it interacts with external services.

### 7. Subscription & Payments
BirdBot.ai offers Lite ($19/mo), Pro ($39/mo), and Max ($79/mo) plans as described on the site. Billing is not yet active. Full payment terms, including billing cycles and refund policy, will be provided at launch. When billing goes live, a cancel-anytime policy will apply and users will be notified in advance.

### 8. Privacy & Data
How we collect, store, and use your data is described in our Privacy Policy. By using BirdBot.ai you agree to that policy.

### 9. Intellectual Property
The BirdBot.ai platform, branding, logo, and code are owned by BirdBot.ai. You retain ownership of your own content and data. By using the service, you grant BirdBot.ai a limited, non-exclusive license to process your data solely for the purpose of providing the service.

### 10. Third-Party Integrations
Your agent may connect to third-party services including Slack, Discord, GitHub, and Telegram. BirdBot.ai is not responsible for the behavior, availability, or policies of those services. You must comply with each third party's own terms of service when using integrations.

### 11. Limitation of Liability
The service is provided "as is" without warranties of any kind. BirdBot.ai makes no guarantees regarding uptime, accuracy, or availability. To the fullest extent permitted by law, BirdBot.ai is not liable for any direct, indirect, incidental, or consequential damages arising from your use of the platform or actions taken by your AI agent.

### 12. Indemnification
You agree to indemnify and hold BirdBot.ai harmless from any claims, damages, or expenses (including legal fees) arising out of your use of the platform, your violation of these Terms, or your violation of any third-party rights.

### 13. Termination
BirdBot.ai may suspend or terminate your account at any time for violations of these Terms. You may delete your account at any time by contacting support@birdbot.ai.

### 14. Changes to Terms
We may update these Terms at any time. Continued use of BirdBot.ai after changes are posted constitutes acceptance of the updated Terms. For material changes, we will notify you by email.

### 15. Contact
Questions or concerns? Contact us at [support@birdbot.ai](mailto:support@birdbot.ai).

---

## Out of Scope (this spec)

- Privacy Policy page (separate spec/plan)
- Contact page
- Cookie consent banner
- Jurisdiction / governing law clause (deferred until LLC is formed)

---

## Implementation Notes

- Create `src/app/terms/page.tsx` as a static page
- Style to match the app's dark theme (`bg-panel`, `text-text-base`, `text-text-dim`, etc.)
- Update Footer.tsx: change the "Terms" `href="#"` to `href="/terms"`
- No new dependencies required
