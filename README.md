# BirdBot.ai — Cloud App

BirdBot is a managed AI agent platform. Users sign up, pick a plan, and get a personal AI assistant deployed in the cloud that runs 24/7. They interact with their agent via a web chat interface and Telegram.

This repo (`birdbot-cloud`) is a single Next.js app that serves both the public landing page and the authenticated dashboard.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Auth | Clerk |
| Database | Neon (PostgreSQL) via Prisma |
| Billing | Stripe (test mode) |
| Testing | Vitest |
| Deployment | Vercel |

## Getting Started

### 1. Clone the repo

```bash
git clone <repo-url>
cd birdbot-cloud
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example file and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and provide values for each variable. See the comments in `.env.example` for where to find each key:

- **Neon** — [console.neon.tech](https://console.neon.tech) → your project → Connection Details
- **Clerk** — [dashboard.clerk.com](https://dashboard.clerk.com) → your application → API Keys
- **Stripe** — [dashboard.stripe.com](https://dashboard.stripe.com) → Developers → API Keys

### 4. Set up the database

Run Prisma migrations against your Neon database:

```bash
npx prisma migrate deploy
```

If you need to generate the Prisma client after schema changes:

```bash
npx prisma generate
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The landing page is at `/` and the dashboard is at `/dashboard` (requires sign-in).

### 6. Set up Stripe webhooks (for billing)

In a separate terminal, forward Stripe events to your local server:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret printed by the CLI into `STRIPE_WEBHOOK_SECRET` in your `.env.local`.

## Project Structure

```
src/
  app/
    api/              # API routes (agents, checkout, waitlist, Stripe webhooks)
    dashboard/        # Authenticated dashboard pages (chat, plan, usage, etc.)
    sign-in/          # Clerk sign-in page
    sign-up/          # Clerk sign-up page
    page.tsx          # Public landing page
    layout.tsx        # Root layout (Clerk provider, fonts, StarField background)
  components/
    dashboard/        # Dashboard UI (Sidebar, AgentSetupWizard, WizardContext, etc.)
    landing/          # Landing page sections (Hero, Pricing, Waitlist, etc.)
    ui/               # Shared primitives (Button, Badge)
  lib/
    prisma.ts         # Prisma client singleton (Neon adapter)
    stripe.ts         # Stripe client singleton + plan config
    clerk-appearance.ts
  types/
    wizard.ts         # Types for the agent setup wizard
prisma/
  schema.prisma       # Database schema (WaitlistEntry, Agent)
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests with Vitest |
| `npm run test:watch` | Run tests in watch mode |

## Running Tests

```bash
npm run test
```

Tests live in `src/__tests__/`. The test suite uses Vitest.

## Key Concepts

**Agent Setup Wizard** — New users who sign in are guided through a multi-step wizard (`AgentSetupWizard`) to name and configure their AI agent. Wizard state is managed by `WizardContext`.

**Incubating Gate** — After an agent is created, it has `status: "incubating"` while being provisioned. `IncubatingGate` shows a holding screen until the agent is live.

**Stripe billing flow** — The `/api/checkout` route creates a Stripe Checkout session. Stripe posts events to `/api/webhooks/stripe` after payment. The webhook handler needs database writes wired up (see TODO comments in that file).

## Pending Work

See TODO comments in `src/app/api/webhooks/stripe/route.ts` — after a successful checkout, the app needs to persist subscription data and update user records in the database.
