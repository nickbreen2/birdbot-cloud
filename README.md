# BirdBot.ai — Cloud App

BirdBot is a personal AI assistant platform. Users sign up, connect their Telegram account, and get an AI that lives in their messages — remembering things, tracking threads, and catching open loops.

This repo (`birdbot-cloud`) is a single Next.js app that serves both the public landing page and the authenticated dashboard.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Auth | Clerk |
| Database | Neon (PostgreSQL) via Prisma |
| Background Jobs | Trigger.dev |
| AI | Anthropic Claude |
| Billing | Stripe |
| Testing | Vitest |
| Deployment | Vercel |

## Getting Started

### 1. Clone the repo

```bash
git clone <repo-url>
cd birdbot-cloud
2. Install dependencies

npm install
3. Set up environment variables

cp .env.local.example .env.local
Fill in each value — see the comments in .env.local.example for where to find each key. The required services are:

Neon — console.neon.tech → your project → Connection Details. You need both DATABASE_URL (pooled) and DIRECT_URL (direct) — Prisma migrations require the direct connection.
Clerk — dashboard.clerk.com → your application → API Keys
Stripe — dashboard.stripe.com → Developers → API Keys. Create two subscription products (monthly + annual) and paste the Price IDs.
Anthropic — console.anthropic.com → API Keys
Trigger.dev — cloud.trigger.dev → your project → API Keys
Telegram — Create a bot via @BotFather to get TELEGRAM_BOT_TOKEN. Generate TELEGRAM_WEBHOOK_SECRET with openssl rand -hex 32. After deploying, register the webhook with Telegram pointing to https://yourdomain.com/api/telegram/webhook.
Google OAuth — console.cloud.google.com → APIs & Services → Credentials → Create OAuth 2.0 Client. Set the redirect URI to https://yourdomain.com/api/google/callback. Generate GOOGLE_OAUTH_STATE_SECRET with openssl rand -hex 32 and GOOGLE_TOKEN_ENCRYPTION_KEY with openssl rand -base64 32.
ADMIN_EMAILS — Comma-separated list of emails that bypass the subscription check. Set this to your own email so you can access the dashboard without a paid subscription in development.
4. Set up the database

npx prisma migrate deploy
If you need to regenerate the Prisma client after a schema change:


npx prisma generate
5. Run the dev server

npm run dev
Open http://localhost:3000. The landing page is at / and the dashboard is at /dashboard (requires sign-in and an active subscription, or an ADMIN_EMAILS bypass).

6. Set up Stripe webhooks locally

stripe listen --forward-to localhost:3000/api/webhooks/stripe
Copy the webhook signing secret into STRIPE_WEBHOOK_SECRET in .env.local.

Project Structure

src/
  app/
    api/
      checkout/         # Create Stripe Checkout session
      billing-portal/   # Open Stripe customer portal
      billing-info/     # Current subscription state
      google/           # Google OAuth flow (start + callback)
      telegram/         # Telegram webhook receiver
      hq/               # Dashboard brief data (threads, loops, learned)
      memory/           # Memory CRUD
      onboarding/       # Onboarding state
      account/          # Account deletion
      webhooks/stripe/  # Stripe event handler
    dashboard/
      page.tsx          # HQ brief (threads, open loops, recently learned)
      memory/           # Memory browser
      integrations/     # Google + Telegram connection management
      loops/            # Loop history
      [...]slug]/       # Dynamic dashboard pages
    onboarding/         # Onboarding wizard pages
    page.tsx            # Public landing page
    layout.tsx          # Root layout (Clerk provider, fonts, background)
  components/
    auth/               # AuthModal (sign-in/sign-up modal)
    dashboard/          # Sidebar, BottomTabBar, SettingsModal, AccountModal, etc.
    landing/            # Landing page sections (Hero, Navbar, FAQ, etc.)
    onboarding/         # Wizard steps + WizardContext
    ui/                 # Shared primitives (Button, Badge, BirdbotIcon)
  lib/
    prisma.ts           # Prisma client singleton (Neon adapter)
    stripe.ts           # Stripe client singleton + plan config
    google.ts           # Google OAuth client helpers
    tokenEncryption.ts  # AES-256-GCM encryption for stored OAuth tokens
prisma/
  schema.prisma         # Full database schema
trigger/
  tasks/                # Trigger.dev background task definitions
Available Scripts
Command	Description
npm run dev	Start the development server
npm run build	Create a production build
npm run start	Start the production server
npm run lint	Run ESLint
npm run test	Run tests with Vitest
npm run test:watch	Run tests in watch mode
Key Concepts
Auth — Sign-in and sign-up are handled via a modal (AuthModal + Clerk) on the landing page. There are no dedicated /sign-in or /sign-up pages in the main flow.

Onboarding wizard — After a user subscribes and signs in for the first time, they go through a multi-step wizard (/onboarding) to connect Telegram and configure their assistant. Completion is tracked via publicMetadata.onboardingComplete on the Clerk user object.

Dashboard HQ — The main dashboard page (/dashboard) shows a live brief: topics Bird is tracking, open loops (things the user said they'd do), and recently learned facts.

Subscription gate — dashboard/layout.tsx checks for an active Stripe subscription on every dashboard request. Users without one are redirected to the landing page. Emails in ADMIN_EMAILS bypass this check.

Google token encryption — OAuth tokens for Google Drive are encrypted at rest using AES-256-GCM (lib/tokenEncryption.ts) before being stored in the database.

Telegram webhook — Incoming messages from users arrive at /api/telegram/webhook. The secret header is verified with a constant-time comparison to prevent timing attacks.
