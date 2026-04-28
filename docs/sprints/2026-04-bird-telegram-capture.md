# Sprint: Bird Telegram Capture Loop

> Goal: Ship the smallest demonstrable Bird — capture messages on Telegram, extract entities, persist to memory, show on a dashboard page.
>
> Created: 2026-04-27
> Branch: feature/mvp-connect-step

---

## What we're building

A user signs up on birdbot.ai, visits /dashboard/integrations, clicks "Connect Telegram," and follows a deep link to open the BirdBot Telegram account. The bot pairs their account. From that point, every message they send to the bot is received by the backend, attributed to their user record, run through entity extraction (Claude Haiku), and persisted to the knowledge graph. The bot sends a short confirmation back. The user can then visit /dashboard/memory to see their captured messages, extracted entities, and an interactive graph of how those entities relate.

## What this sprint does NOT include

- No actions in user's tools (no Gmail drafts, no Calendar events, etc.)
- No multi-turn conversations (Bird responds with simple acknowledgment only)
- No graph view as a primary view (list view is the default; graph exists but is secondary)
- No onboarding wizard (users go straight to /dashboard after sign-up)
- No integrations beyond Telegram
- No Goals tab (hidden in nav for MVP)

---

## Audit findings

### SURPRISE: The entire pipeline is already built in code.

All five phases below — pairing, inbound handler, entity extraction, acknowledgment, memory page — exist and appear fully implemented on this branch. The sprint is not about building new features. It is about wiring up infrastructure, deploying, verifying end-to-end, and onboarding the first real users.

### A. Telegram bot infrastructure

**What exists:**
- `src/lib/telegram.ts` — type definitions (`TelegramUpdate`, `TelegramMessage`, etc.) and `sendTelegramMessage()` (raw fetch to Telegram Bot API, no library dependency).
- `src/app/api/telegram/webhook/route.ts` — POST handler with HMAC secret verification (`x-telegram-bot-api-secret-token`). Validates the update, then triggers a Trigger.dev task and returns 200.
- `src/scripts/setup-telegram-webhook.ts` — one-time script to register the webhook URL with Telegram. Uses `APP_URL` env var. Has guards for localhost and missing vars.
- `.env.local` has `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_BOT_USERNAME` (bot is `@littlebirdy_ai_bot`).
- No Telegram library installed — uses native `fetch`. This is intentional and clean.

**What's missing:**
- `.env.local.example` does NOT include Telegram vars or `ANTHROPIC_API_KEY`. This is a documentation gap; actual credentials exist locally.
- Webhook has NOT been registered against the production Vercel URL (the setup script must be run once after deploy).
- Telegram vars and `ANTHROPIC_API_KEY` are NOT yet in Vercel environment variables (must be added before deploy).

### B. Telegram pairing flow

**What exists:**
- `prisma/schema.prisma` — `TelegramUser` model (userId ↔ telegramChatId, username, firstName) and `TelegramPairingToken` model (userId, token, expiresAt, usedAt).
- `src/app/api/telegram/pair/route.ts` — POST, auth-gated. Generates a 6-byte hex token, writes it to DB with 15-min expiry, returns `deepLink` (`https://t.me/littlebirdy_ai_bot?start=<token>`).
- `src/app/api/telegram/status/route.ts` — GET, auth-gated. Returns `{ paired: false }` or `{ paired: true, displayName: "@username" }`.
- `src/app/dashboard/integrations/page.tsx` — complete pairing UI: loading state → "Connect Telegram" button → deep link with "Open in Telegram" → "Check if connected" refresh button → paired state with display name.
- `src/trigger/telegram.ts` — handles `/start <token>`: looks up token, validates expiry/used, creates `TelegramUser`, marks token as used, sends welcome message. Also handles `/start` with no token and the already-paired case.

**What's partial / known issues:**
- The in-memory `unpairedCooldown` Map in `src/trigger/telegram.ts` won't work in Trigger.dev cloud — each task invocation is a fresh process, so the rate-limit state resets. Unpaired users who spam the bot will get a reply on every message. Not a security issue; mildly annoying. Can be replaced with a DB-backed check later.

**What's missing:** Nothing for MVP.

### C. Memory schema

**What exists:**

All models are in `prisma/schema.prisma` and have been migrated:

| Model | Key fields |
|---|---|
| `Entity` | id, userId, name, type (7 enum values), description, embedding (vector 1536), createdAt |
| `Relationship` | id, userId, fromId → Entity, toId → Entity, label, weight |
| `Mention` | id, userId, entityId → Entity, sourceType (session/decision/telegram), sourceId, snippet |
| `Goal` | id, userId, entityId → Entity (unique), title, status, cadence, lastCheckinAt, targetDate |
| `UserPreferences` | id, userId, personalityPreset, personalitySliders, globalCheckinEnabled |
| `TelegramUser` | id, userId (unique), telegramChatId (unique), username, firstName |
| `TelegramPairingToken` | id, userId, token (unique), expiresAt, usedAt |

Migration history: `20260421000001` created all tables. `20260421000002` added entity type values. `20260421000003` corrected enum values, renamed columns, and fixed column names to match the final spec.

**What's missing:** No migration to add Telegram vars is needed — the Telegram tables were added in the P1 sprint.

### D. Memory page UI

**What exists:**
- `/dashboard/memory` — page with view toggle (Graph / List).
- `src/components/memory/ListView.tsx` — paginated message feed with search (debounced), source badges (Telegram/MCP/Decision), entity chips, relative timestamps, "Load more" with cursor pagination.
- `src/components/memory/GraphView.tsx` — 336-line D3 force-directed graph. Nodes sized by mention count, colored by entity type. Click a node to open EntityPanel.
- `src/components/memory/EntityPanel.tsx` — slide-in detail panel showing entity type, description, and all mentions with pagination.
- `GET /api/memory` — paginated cursor query using `DISTINCT ON` per sourceId. Supports search via ILIKE on snippet and entity names. Batch-fetches entities per page (no N+1).
- `GET /api/memory/graph` — returns all entities + relationships for graph rendering.
- `GET /api/memory/entity/[id]` — entity detail + paginated mention history.

**What's missing:** Nothing for MVP. The List view is the default (`?view=graph` must be explicitly set). Graph defaults first in the toggle but the sprint spec says list should be default — this is a minor UX decision, not a bug.

**Empty state:** `ListView` renders a "Bird hasn't heard from you yet" screen with a "Set up Telegram" link when there's no data.

### E. Entity extraction / LLM integration

**What exists:**
- `src/trigger/extractEntities.ts` — full extraction pipeline using `@anthropic-ai/sdk`. Calls Claude Haiku (`claude-haiku-4-5-20251001`). Parses response with Zod. Persists entities, mentions, relationships. Goal confidence gate at 0.7.
- `src/lib/extractionPrompt.ts` — system prompt, tool definition, Zod schema. Well-documented entity types with clear disambiguation rules (e.g., package names are `concept`, not `file`).
- The extraction is called as `runEntityExtraction()` (not `tasks.trigger`) inside `telegramProcess` — meaning it runs inline within the Trigger.dev task, not as a separate task invocation.
- `src/scripts/test-extraction.ts` — eval script against real CloudSession/CloudDecision rows, or sample data if DB is empty. Does not write to DB.
- `ANTHROPIC_API_KEY` is set in `.env.local`.

**What's missing:**
- `ANTHROPIC_API_KEY` not in Vercel environment variables (must be added).

### F. Dashboard infrastructure

**What exists:**
- `src/app/dashboard/layout.tsx` — `Sidebar`, `MobileHeader`, `BottomTabBar`, `SettingsModal`, `AccountModal`. `WizardProvider` is in the tree but the wizard is not mounted.
- Sidebar nav: Memory, Integrations only. Goals is hidden. No wizard.
- `BottomTabBar` — mobile: Memory, Integrations.
- `/dashboard` redirects to `/dashboard/memory`.
- Routes present: `/dashboard/memory`, `/dashboard/integrations`, `/dashboard/goals` (accessible but not in nav), `/dashboard/settings` (accessible from UserMenu).

---

## Phases

### Phase 1: Environment & deployment setup [0.5 days]

**Goal:** The production deployment can receive Telegram messages, run extraction, and write to the DB.

The code is done. The work is configuration.

**Tasks:**

- [ ] Add Vercel env vars: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_BOT_USERNAME`, `ANTHROPIC_API_KEY`.
- [ ] Add these same vars to `.env.local.example` (documentation fix — commit on this branch before deploy).
- [ ] Deploy Trigger.dev tasks to production: `cd birdbot-cloud && npx trigger.dev@latest deploy`. Confirm `telegram-process` and `extract-entities` appear in the Trigger.dev dashboard.
- [ ] Add `TRIGGER_SECRET_KEY` (production) to Vercel env vars if not already present.
- [ ] Deploy the app to Vercel (push to production branch or trigger manually).
- [ ] Run `APP_URL=https://birdbot.ai npx tsx src/scripts/setup-telegram-webhook.ts` to register the webhook. Confirm with `getWebhookInfo` output — look for `pending_update_count: 0` and no `last_error_message`.

**Verification:**
- Send a message to `@littlebirdy_ai_bot` directly on Telegram. Check Trigger.dev dashboard for a `telegram-process` run. Confirm it completes without error.

---

### Phase 2: Pairing flow smoke test [0.5 days]

**Goal:** A real user (you) can pair their Telegram account from the dashboard.

**Tasks:**

- [ ] Sign in to the live birdbot.ai dashboard.
- [ ] Go to /dashboard/integrations. Confirm the page loads with "Connect Telegram" state.
- [ ] Click "Connect Telegram". Confirm a deep link appears.
- [ ] Open the deep link. Confirm the Telegram app opens to `@littlebirdy_ai_bot` with a "Start" button.
- [ ] Tap Start. Confirm the bot replies with the welcome message ("Connected! Send me your notes…").
- [ ] Click "Check if connected" on the integrations page. Confirm status changes to "Connected as @yourusername".
- [ ] Check the Neon DB: confirm a row exists in `TelegramUser` with your `userId` and `telegramChatId`.
- [ ] Check Trigger.dev: confirm the `telegram-process` run for the `/start` command completed successfully.

**Known edge cases to test:**
- Tap Start again after pairing → should get the "already connected" message.
- Let the pairing token expire (15 min), then click the deep link → should get the "expired" message.

---

### Phase 3: Inbound message → memory end-to-end [1 day]

**Goal:** Sending a message to the bot creates entities in the DB and shows them in the Memory dashboard.

**Tasks:**

- [ ] Send a message to the bot: `Working on the Telegram capture loop today. Need to finish entity extraction testing before Nick can onboard beta users.`
- [ ] Check Trigger.dev for a `telegram-process` run. Confirm it completes. Review logs: extraction should return `entitiesCreated > 0`.
- [ ] Go to /dashboard/memory (list view). Confirm the message appears as a card with entity chips.
- [ ] Click the Graph view toggle. Confirm entities appear as nodes.
- [ ] Click a node. Confirm the EntityPanel slides in with the entity name, type, and the message as a mention.
- [ ] Check Neon DB directly: confirm rows in `Entity`, `Mention`, and at least one `Relationship` table.

**Edge cases to test:**
- Send a message with no extractable entities (e.g., "hi"): bot should reply "Noted. Nothing specific to log from that one."
- Send a message with a goal statement (e.g., "I want to ship by Friday"): check that a `Goal` row is created with status `active` or `pending_confirmation` based on confidence.

---

### Phase 4: Bug fix — in-memory rate limiting [0.5 days]

**Goal:** The unpaired-user cooldown actually works in cloud.

**Context:** `src/trigger/telegram.ts` uses `const unpairedCooldown = new Map<number, number>()` to rate-limit "I don't recognize this account" replies. In Trigger.dev cloud, each task run is a fresh Node.js process — this Map is always empty. An unpaired user who spams the bot gets a reply every time.

**Fix options (choose one):**
1. Replace the Map with a DB query: before sending the reply, check if `TelegramUser` exists with `telegramChatId`. If yes, skip. If no, look up a `TelegramRateLimit` record (or reuse any lightweight table). This is the clean solution.
2. Accept the bug for MVP. It only affects unpaired users sending multiple messages. Priority: low. Defer to post-beta.

**Recommendation:** Defer. The bug is cosmetic for MVP scope. A real user won't spam unpaired messages once they know how to pair. Add a TODO comment in the code so it's easy to find.

---

### Phase 5: Private beta onboarding [1–2 days]

**Goal:** 3–5 people from the waitlist can use Bird without your help.

**Tasks:**

- [ ] Write a one-paragraph invite message that explains: (1) what Bird is right now, (2) how to pair Telegram, (3) what to do with it, (4) what it can't do yet.
- [ ] Confirm the pairing flow works for a fresh account (no prior sessions). Sign up with a new email to verify.
- [ ] Confirm the memory page loads for a new account (empty state, not an error).
- [ ] Confirm the integrations page loads and the "Connect Telegram" flow completes for a fresh account.
- [ ] Send invites to first 3–5 testers with the pairing instructions.
- [ ] Monitor Trigger.dev runs for the first 48 hours. Watch for extraction errors or task failures.
- [ ] Gather feedback: does the acknowledgment message make sense? Is the memory page useful? What's confusing?

**Monitoring to set up before beta:**
- Trigger.dev alerts for failed runs (`telegram-process` or `extract-entities` task failures).
- Check Neon DB growth over first few days — confirm no runaway writes.

---

### Phase 6: Post-beta polish [TBD after beta findings]

Based on what the first users experience. Common expected issues:

- Extraction quality: entities too noisy, wrong types, missing obvious things. → Tune prompt in `src/lib/extractionPrompt.ts`.
- Memory page UX: hard to understand what the entities mean without context. → Add message text more prominently, improve empty state copy.
- Pairing UX: the "Check if connected" step is manual. → Add polling (every 2s for 30s after link is opened).
- Acknowledgment messages: too terse, users don't understand what "3 entities" means. → Add entity names to the ack: "Got it — logged Next.js (technology), finish auth flow (task)."

---

## Open questions / decisions to make during the sprint

1. **Memory page default view:** The page defaults to Graph (`?view=graph`). The sprint spec says "use the existing feed view." Should we flip the default to List? Probably yes — graph is beautiful but confusing with only 2–5 entities. List is immediately understandable.

2. **Acknowledgment message:** Current messages reference "entities" (a technical term). Consider making them more natural: "Noted — logged 2 things." or "Got it — 3 new notes added to your memory."

3. **Pairing token UX:** After generating the link, the user must manually click "Check if connected." Consider auto-polling every 2s after the link is clicked. But don't build this until you know if the manual check is actually confusing beta users.

4. **Rate-limit bug:** See Phase 4. Decision: defer or fix?

5. **Bot username:** The bot is `@littlebirdy_ai_bot`. Is this the permanent username? If you rename the bot, the deep link URL changes, which breaks any previously-shared pairing links.

---

## Out of scope / future sprints

- Onboarding wizard (the three-part wizard from earlier discussion)
- Graph view as primary experience
- Real integrations (Gmail, Calendar, Drive)
- Multi-turn conversations / actual assistant capabilities
- Other channels (iMessage, WhatsApp, Email)
- Goals tab re-enabling
- Embedding-based search (pgvector column exists but is not populated)
- Personality presets

---

## Definition of done

The sprint is done when:

- [ ] A user signs up on the website
- [ ] User pairs their Telegram account from /dashboard/integrations
- [ ] User sends a message to Bird on Telegram
- [ ] Bird saves the message and extracts entities to the knowledge graph
- [ ] Bird sends a short acknowledgment back
- [ ] User can view captured memory in /dashboard/memory (list view)
- [ ] At least 3 friendly testers can run this flow without help from Nick

---

## Appendix: files to know

| File | What it does |
|---|---|
| `src/lib/telegram.ts` | Type definitions + `sendTelegramMessage()` |
| `src/app/api/telegram/webhook/route.ts` | Receives Telegram updates, triggers task |
| `src/app/api/telegram/pair/route.ts` | Generates pairing token + deep link |
| `src/app/api/telegram/status/route.ts` | Checks if user is paired |
| `src/trigger/telegram.ts` | Handles all bot logic: pairing, extraction dispatch, ack |
| `src/trigger/extractEntities.ts` | Claude Haiku extraction pipeline |
| `src/lib/extractionPrompt.ts` | System prompt, Zod schema, tool definition |
| `src/scripts/setup-telegram-webhook.ts` | One-time webhook registration |
| `src/app/dashboard/integrations/page.tsx` | Pairing UI |
| `src/app/dashboard/memory/page.tsx` | Memory UI (graph + list toggle) |
| `src/components/memory/ListView.tsx` | Paginated feed with search |
| `src/components/memory/GraphView.tsx` | D3 force graph |
| `src/components/memory/EntityPanel.tsx` | Entity detail slide-in panel |
| `src/app/api/memory/route.ts` | `GET /api/memory` — paginated feed |
| `src/app/api/memory/graph/route.ts` | `GET /api/memory/graph` — graph data |
| `src/app/api/memory/entity/[id]/route.ts` | `GET /api/memory/entity/:id` — entity detail |
