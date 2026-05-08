# BirdBot.ai — Sprint Breakdown (v2 — Bird Companion)

> Updated: April 21, 2026 | Project Lead: Nick Breen
> Supersedes all prior sprint and planning docs.

---

## Product Overview

BirdBot is a personal AI companion users text from Telegram. The Bird remembers everything they tell it (notes, projects, goals, life context), proactively checks in on their goals, and exposes its memory to coding agents via MCP. The product is the Bird — a character with personality, persistent memory, and presence in the user's daily life. The graph and MCP are the substrate that makes the Bird actually useful; they are not the product.

Reference shape: Memorae (memorae.ai) — text-your-AI-from-a-messaging-app, it remembers, it follows up. We diverge from Memorae by having (a) much stronger character/personality, (b) MCP integration for the dev-leaning slice of our audience, and (c) a richer underlying memory graph rather than a flat reminder model.

**Audience (locked):** Builder/founders who code AND have chaotic personal lives. Same person uses the Bird from Telegram on their phone for life stuff and from Claude Code/Cursor on their laptop for project context. One memory, multiple surfaces.

---

## Sprint 1 — Foundation + Dashboard + Data Layer ✅ COMPLETE

**Owner:** Nick (solo)
**Status:** Done — most of this carries forward, see Sprint P0 for what gets archived

What was built: landing page, Clerk auth, Neon Postgres + Prisma, original 4-step agent wizard, dashboard shell with sidebar, settings modal with personality sliders, Stripe checkout (webhook DB writes deferred), MCP API routes (`/api/connection/*`, `/api/mcp/*`), projects API + UI, deployed on Vercel.

The infrastructure (auth, billing, deployment, MCP API, projects API, primitive UI components) is all reusable for the Bird companion direction. The agent provisioning code, channel selection, model picker, and focus-area grid are not — they get archived in P0.

---

## Sprint P0 — Archive + Partial Un-archive 🔨 NEXT UP

**Owner:** Nick + Claude Code
**Goal:** Clear out the agent-provisioning architecture without losing the personality wizard pieces that translate to the new product. Set the stage for P1's schema work.

### Tasks

**P0-01: Drop provisioning database tables**
- Drop `Agent` model from `birdbot-cloud/prisma/schema.prisma` (lines ~16–35 plus the `server Server?` relation line)
- Drop `Server` model from `birdbot-cloud/prisma/schema.prisma` (lines ~37–51 plus the `agents Agent[]` line)
- Run migration: `npx prisma migrate dev --name "drop_agent_server_tables"`
- Regenerate client: `npx prisma generate`
- Delete stale generated model files: `src/generated/prisma/models/Agent.ts`, `src/generated/prisma/models/Server.ts`

**P0-02: Delete provisioning code**

Delete these files entirely:
- `src/trigger/provision.ts` — Hetzner SSH/Docker provisioning Trigger.dev task
- `src/app/api/agents/create/route.ts`
- `src/app/api/agents/route.ts`
- `src/app/api/agents/[id]/route.ts`
- `src/app/api/provision/route.ts`
- `src/app/api/provision/[id]/route.ts`
- `src/app/api/provision/[id]/status/route.ts`
- `src/lib/deprovisionAgent.ts`

> **Note:** `src/lib/buildPrompt.ts` and `src/lib/synthesis.ts` were originally listed here but are actively used — `buildPrompt` by the install modals, `synthesis` by `/api/mcp/briefing`. Both retained.

Delete now-empty directories: `src/app/api/agents/`, `src/app/api/provision/`

**P0-03: Delete agent-only wizard components**

Delete these files entirely:
- `src/components/wizard/ModelSelector.tsx` — Bird picks model behind the scenes, not user choice
- `src/components/wizard/FocusAreaGrid.tsx` — replaced by goals (entities captured via chat)

Delete directory if now empty: `src/components/wizard/`

**P0-04: Move personality wizard pieces to /components/onboarding/**

Create directory: `src/components/onboarding/`

Files to move:
- `src/components/wizard/TraitSlider.tsx` → `src/components/onboarding/TraitSlider.tsx` (no changes needed yet)
- `src/components/dashboard/WizardContext.tsx` → `src/components/onboarding/WizardContext.tsx`

Note on WizardContext: the current file imports `CreateAgentPayload` from `@/types/wizard` and has agent-coupled state (`agents: AgentData[]`, `onboarded`, `agentsLoaded`, `refreshAgents`). After moving, strip those agent-specific imports and fields so the file compiles. Do not fully repurpose the context for Bird onboarding yet — that is P5's job. The goal here is: file is moved, compiles, agent refs are gone, Bird-relevant state (personality, wizard flow control) remains.

File to update in-place:
- `src/types/wizard.ts` — strip agent-specific exports: `ModelId`, `ChannelId`, `MODELS`, `CHANNELS`, `AgentConfig`, `CreateAgentPayload`, `FocusId`, `FOCUS_AREAS`. Keep: `WizardStep`, `TRAIT_KEYS`, `TraitKey`, `Traits`, `TRAIT_LABELS`, `TOTAL_POINTS`, `MIN_POINTS_TO_PROCEED`.

**P0-05: Remove birdbot-agent and birdbot-core directories**
- `birdbot-agent/` — health check placeholder container, no longer needed
- `birdbot-core/` — OpenClaw fork, not part of the new thesis
- Move to `_archived/` at the repo root (safer than deleting in case anything is referenced)

**P0-06: Archive old strategy docs**

Move these to `_archived/docs/` at the repo root:
- `BIRDBOT_FORK_GUIDE.md` — OpenClaw fork guide, obsolete
- `BIRDBOT_PRD_CLAUDE_CODE.md` — old PRD
- `BIRDBOT_PROJECT_PLAN.md` — old project plan
- `BIRDBOT_PRODUCT_DIRECTION.md` — superseded by NORTH_STAR (itself now superseded)
- `BIRDBOT_NORTH_STAR.md` — the "context layer for coding tools" framing from April 17; superseded by the Bird companion direction
- `BIRDBOT_ROADMAP.md` — old roadmap
- `BIRDBOT_SPRINT_BREAKDOWN.md` — the pre-KG-pivot sprint breakdown; this doc replaces it
- `MERGE_DEPLOY_NOTES.md` — Sprint 2/3 operational notes, no future utility
- `SPRINT3_INTEGRATION_NOTES.md` — same

Keep at root: `BIRDBOT_KG_SPRINT_BREAKDOWN.md` (this doc — the new source of truth)

**P0-07: Delete agent test**
- Delete `src/__tests__/api/agents-create.test.ts`
- Run `npx vitest run` — all remaining tests must pass

**P0-08: Verify the build**

```bash
npx tsc --noEmit
npx next build
```

Both must succeed with zero errors. This is the gate — don't move to P1 until the build is clean.

### Sprint P0 Definition of Done

`npx vitest run` passes. `npx next build` succeeds. No references to `Agent`, `Server`, `provision`, or Hetzner exist anywhere in `birdbot-cloud/src/`. The `birdbot-agent/` and `birdbot-core/` directories are moved to `_archived/`. Old strategy docs are moved to `_archived/docs/`. Personality wizard components (`TraitSlider.tsx`, `WizardContext.tsx`) are at `src/components/onboarding/` and compile. `src/types/wizard.ts` no longer exports agent-specific types.

---

## Sprint P1 — Graph Schema ✅ COMPLETE

> Schema reviewed and corrected 2026-04-21. A full spec-vs-implementation diff was run after P1 landed; five mismatches were found and fixed in migration `20260421000003_p1_schema_corrections`. The confirmed schema below is the source of truth.

**Owner:** Nick + Claude Code
**Goal:** Lay down the database tables that everything else depends on. Schema only, no application logic. Stop and show Nick the full proposed schema before running the migration.

### Tasks

**P1-01: Add core graph tables**

Three new models: `Entity`, `Relationship`, `Mention`.

Key design decisions baked in:
- `Entity` has both `userId` (Clerk) and `userToken` (MCP bearer token, nullable). Entities from MCP always have `userToken`; entities from Telegram may not (user hasn't installed MCP). Queries route through `userId` as the canonical key; MCP tools resolve `userToken → userId` via `McpConnection`. The dual-key is intentional — the tradeoff is slightly more complex join logic vs. a cleaner user model.
- `Entity.project` is nullable. MCP-sourced entities always have a project. Telegram-sourced entities default to NULL (no project context). MCP tools filter by project; Memory/Goals tabs query by userId across all projects.
- Entity types: `file`, `concept`, `decision`, `task`, `technology`, `person`, `goal` (7 types exactly)
- `Relationship` gets a unique constraint on `(userId, fromId, toId, label)` to enable idempotent upserts from the extraction pipeline
- `MentionSourceType`: `session`, `decision`, `telegram` (three distinct values — kept separate so P3/P4 queries can filter by sub-type)
- `Goal` uses `lastCheckinAt` (nullable) for the P8 cron overdue-ratio algorithm; also has `targetDate` (nullable)
- `UserPreferences` has `personalityPreset TEXT DEFAULT 'assistant'` and `globalCheckinEnabled BOOLEAN DEFAULT true` (both required by P8)
- `TelegramPairingToken` uses `usedAt TIMESTAMP` (nullable) instead of a boolean — records when the token was consumed, strictly better than a flag
- `TelegramUser` uses `telegramChatId` (the chat ID used to send messages, semantically correct)

**P1-02: Enable pgvector on Neon**
- Run `CREATE EXTENSION IF NOT EXISTS vector;` in Neon SQL editor
- Update `schema.prisma` generator block to declare the extension
- Embedding dimension: `vector(1536)` — matches OpenAI `text-embedding-3-small`
- Confirm embedding provider before P4 ships (see P4-04); switching providers requires re-embedding everything, so locking the dimension now matters

**P1-03: Add Goal model**

Separate model (not just an Entity row) because the cron job needs efficient indexed queries on `status` + `lastCheckinAt` that a JSON properties column can't provide cleanly.

Fields:
- `id`, `userId` (Clerk), `entityId` (optional FK to Entity — the graph node for this goal), `title`, `description`, `targetDate` (nullable), `status` (enum below), `cadence` (enum below), `lastCheckinAt` (nullable), `createdAt`, `updatedAt`

Status enum: `active | paused | completed | abandoned | pending_confirmation`
- `pending_confirmation` is for goals extracted with low confidence — check-in cron skips these; Bird must confirm with user before flipping to `active`

Cadence enum: `daily | weekly | biweekly | monthly` (default: weekly)

Indexes: `(userId, status)`, `(userId, lastCheckinAt)`

**P1-04: Add UserPreferences model**

One row per user. Holds all Bird configuration that isn't per-goal.

Fields: `id`, `userId` (Clerk, unique), `userToken` (MCP bearer token, nullable — same value as `McpConnection.userToken` when connected), `personalityPreset` (string, default `"assistant"`), `personalitySliders` (JSON, default `{}`), `globalCheckinEnabled` (bool, default true), `timezone` (nullable, defer until v1.5), `createdAt`, `updatedAt`

**P1-05: Add Telegram models**

`TelegramUser`: `id`, `userId` (Clerk, unique), `telegramChatId` (unique), `username?`, `firstName?`, `lastName?`, `createdAt`, `updatedAt`

`TelegramPairingToken`: `id`, `userId`, `token` (unique, 16-byte hex), `usedAt` (timestamp, nullable — records when consumed; better than a boolean flag), `expiresAt` (15-minute TTL), `createdAt`

**P1-06: Write a smoke test for the new schema**

File: `src/__tests__/api/graph-schema.test.ts`

Cover: entity creation, relationship creation, mention creation, unique constraint enforcement on `(userId, project, name, type)`, cascade delete (removing entity removes its relationships and mentions).

**P1-07: Checkpoint — show Nick before migrating**

Show the full `schema.prisma` diff before running any migration. Easier to fix on paper than after the fact.

### Sprint P1 Definition of Done

Full schema diff approved by Nick. Migration runs cleanly. Three new tables plus `Goal`, `UserPreferences`, `TelegramUser`, `TelegramPairingToken` exist in Neon. pgvector is enabled. Prisma client regenerates. `npx tsc --noEmit` passes. Smoke tests pass. Do not start P2/P3/P6 until P1 is confirmed complete.

---

## Sprint P2 — Extraction Pipeline 📋 PLANNED

**Owner:** Claude Code
**Goal:** When text arrives (from MCP or Telegram), an LLM extracts structured entities and relationships and writes them to the graph. This is the hardest engineering work in v1.

### Tasks

**P2-01: Build the extract-entities Trigger.dev task**

File: `src/trigger/extractEntities.ts`

- Input: raw text + sourceType (`session | decision | telegram`) + userId + optional project
- Output: entities and relationships written to graph via upsert
- Model: Claude Haiku (cost-sensitive, high volume)
- Async pattern: text stored immediately, extraction runs background, graph updates ~2–5 seconds after write
- Retry: up to 3 attempts with exponential backoff

**P2-02: Write the extraction prompt**

File: `src/lib/extractionPrompt.ts`

Define all 7 entity types with examples. Entity types:
- `file` — source files, config files (exact path if mentioned)
- `concept` — named abstractions ("AuthService", "billing pipeline")
- `decision` — architectural choices ("use Prisma over Drizzle")
- `task` — todos, open issues, blockers
- `technology` — libraries, frameworks, services ("Stripe", "Next.js")
- `person` — team members, stakeholders
- `goal` — objectives or intentions ("ship by Friday", "raise a seed round", "finish the auth flow")

Output format: Zod-validated JSON with entities + relationships + confidence scores per entity. Confidence is critical for goal extraction (see P2-04).

**P2-03: Wire extraction to inbound writes**
- New `CloudSession` write → trigger extraction
- New `CloudDecision` write → trigger extraction
- New Telegram message → trigger extraction (depends on P6 being wired)

**P2-04: Goal extraction confidence gate**
- High-confidence goals ("I want to ship by Friday") → Goal created with `status: active`, check-ins enabled
- Low-confidence goals ("maybe I should get back to X someday") → Goal created with `status: pending_confirmation`, no check-ins until user confirms
- The Bird queues a clarifying message: "You mentioned getting back to X — want me to track that as a goal?"
- This gate is the difference between the check-in cron being delightful vs. annoying

**P2-05: Iterate on prompt quality before declaring done**
- LLM extraction is non-deterministic and produces junk early
- Build a small eval harness (`src/scripts/test-extraction.ts`) — feed real session summaries, inspect output
- Target: consistently well-formed JSON, sensible entity/relationship extraction, goal confidence scores that actually track human judgment
- Plan for multiple prompt refinement rounds

### Sprint P2 Definition of Done

Text written to any source (MCP session, MCP decision, or Telegram message) triggers a background extraction task. Extracted entities and relationships appear in the graph within ~5 seconds. Goal extraction respects the confidence threshold. Extraction quality is good enough to demo, even if it keeps improving post-launch.

---

## Sprint P3 — MCP Expansion 📋 PLANNED (parallelizable with P2 and P6 after P1)

**Owner:** Claude Code
**Goal:** Expand birdbot-mcp from 3 tools to ~12 tools that expose the knowledge graph to coding agents. Cloud API routes to back them.

### Tasks

**P3-01: Update local SQLite schema in birdbot-mcp**

File: `birdbot-mcp/src/db.ts`

Add `entities` and `relationships` tables mirroring the cloud schema. Add FTS5 virtual table for full-text search (no vectors locally — that's cloud-only). Add SQLite triggers to keep FTS in sync.

**P3-02: Add ~9 new MCP tools**

File: `birdbot-mcp/src/index.ts`

New tools (existing 3 stay unchanged):
- `search_entities` — fuzzy + semantic search across the graph
- `get_entity` — full detail with relationships
- `add_entity` — explicit manual entity creation from the agent
- `relate_entities` — create explicit relationships
- `get_project_graph` — structured relationship map for a project
- `find_related` — "what's related to X?"
- `recent_activity` — what changed in the last session
- `get_session_context` — reconstructed context from N recent sessions
- `search_decisions` — semantic search over decisions only

**P3-03: Add new cloud API routes**
- `GET/POST /api/mcp/entities` — entity search and creation
- `GET /api/mcp/entities/[id]` — entity detail with relationships
- `POST /api/mcp/relationships` — relationship creation
- `GET /api/mcp/graph` — adjacency list for a project
- `GET /api/mcp/activity` — recently updated entities

**P3-04: No personality injection in MCP responses**

MCP tools return clean structured JSON. Personality applies to Telegram + dashboard empty states only. If a narrative tool like `get_project_summary` is added in the future, personality applies there — not to data tools.

**P3-05: Publish updated birdbot-mcp NPM package**
- Bump to v0.2.0
- Update README with new tools
- Test clean install

### Sprint P3 Definition of Done

Coding agents using birdbot-mcp can search, traverse, and write to the graph via all ~12 tools. Cloud API routes respond correctly to bearer-authenticated requests. Existing 3 tools (get_briefing, log_session_end, log_decision) continue to work unchanged.

---

## Sprint P4 — Query Layer 📋 PLANNED

**Owner:** Claude Code
**Goal:** Replace naive ProjectBrief text-stuffing with graph-aware retrieval. The Bird's chat responses become smart instead of bloated.

### Tasks

**P4-01: Build pgvector semantic search helpers**

File: `src/lib/vectorSearch.ts`

Cosine-similarity search over `Entity.embedding`. Returns top-N entities with similarity scores. Set hard token budget for assembled context (4k tokens max).

**P4-02: Rewrite chat context assembly**

File: `src/app/api/projects/[project]/chat/route.ts`

Replace: load entire ProjectBrief → stuff into Claude system prompt
With: query graph for relevant entities → traverse relationships → assemble focused context window (matched entities + their relationships + related decisions + recent mentions).

**P4-03: Rewrite regenerate-project-brief task**

File: `src/trigger/brief.ts`

Old: synthesizes raw text into a blob. New: produces structured summary from graph. Brief becomes a derived view of the graph (a caching layer), not the source of truth.

**P4-04: Embedding strategy**

Embed every Entity at creation/update time via Trigger.dev task. Provider: OpenAI `text-embedding-3-small` (1536 dimensions). This confirms the dimension choice from P1-02. Do not switch providers without a full re-embedding migration plan.

### Sprint P4 Definition of Done

Chat responses are powered by graph queries, not text-stuffing. Retrieval is bounded, fast, and semantically aware. The Bird can answer "what do you know about X?" with focused, relevant context.

---

## Sprint P6 — Telegram Integration 📋 PLANNED (parallelizable with P2 and P3 after P1)

**Owner:** Claude Code
**Goal:** Build the Bird's primary capture surface. Without this, the Bird is a database with a web form.

### Tasks

**P6-01: Telegram bot setup**
- Register bot via @BotFather (single bot serves all users)
- Identify users by `chat_id ↔ userId` mapping in `TelegramUser`
- Configure webhook URL pointing to `/api/telegram/webhook`

**P6-02: Inbound message handler**

File: `src/app/api/telegram/webhook/route.ts`

- Parse incoming Telegram update
- Look up `TelegramUser` by `chat_id` → resolve `userId`
- Store raw message + trigger P2 extraction
- Generate a `Mention` with `sourceType: telegram`

**P6-03: Voice note transcription**
- Telegram sends voice as OGG
- Transcribe via Groq Whisper (cheap + fast — confirm pricing before wiring)
- Treat transcribed text the same as a typed message through extraction pipeline

**P6-04: Photo handling**
- Store reference + generate description via vision model (Claude Haiku or GPT-4o)
- Description text goes through extraction pipeline

**P6-05: Outbound message sender**

Shared helper used by: check-in cron, weekly summary, reply logic. Wraps outgoing message with personality system prompt via `buildSystemPrompt()` (P7 dependency — stub it until P7 is done).

**P6-06: Pairing flow**

Files: `src/app/api/telegram/pair/route.ts`, `src/app/api/telegram/status/route.ts`

Flow:
1. `POST /api/telegram/pair` — generate 16-byte hex token, store `TelegramPairingToken` with 15-min TTL
2. Dashboard displays deep link: `https://t.me/BIRDBOT_NAME?start={token}`
3. User clicks → Telegram opens → taps Start → bot receives `/start {token}`
4. Bot handler: validates token (not used, not expired), creates `TelegramUser`, marks token used, sends Bird's first in-character message
5. `GET /api/telegram/status` → returns connection state for dashboard polling (every 3 seconds)

Note: build a minimal pairing page during P6 (just the "here's your link" screen) so end-to-end testing works before P5 builds the full onboarding polish.

**P6-07: Bird's first message after pairing**

This is the make-or-break wow moment. The first message must: (a) introduce the Bird in character, (b) ask what the user is working on, (c) feel alive not generic.

Before wiring: draft 6 versions (one per personality preset) and show Nick for review. Do not ship a generic "Hi, I'm BirdBot" message.

### Sprint P6 Definition of Done

A user generates a pairing link from the dashboard, opens it, taps Start in Telegram, and within 2 seconds sees a personality-appropriate first message from the Bird. Subsequent messages (text, voice, photo) flow into their graph via the extraction pipeline. The Bird can reply (manually triggered for now — automatic replies are P7).

---

## Sprint P7 — Personality Voice Layer 📋 PLANNED

**Owner:** Claude Code
**Goal:** The Bird's responses feel like a character, not a search box. One coherent voice across every surface where it speaks.

### Tasks

**P7-01: Build buildSystemPrompt() utility**

File: `src/lib/buildSystemPrompt.ts`

Three-layer architecture:
- **Layer 1 — BIRD_BASE**: Who Bird is, what it knows, hard rules (same for everyone). Hard rules include: never more than one proactive message per day, never share user's private context, always speak from memory.
- **Layer 2 — PERSONALITY_OVERLAY**: Derived from user's preset or sliders. Short voice spec per preset (see P7-02). For slider-customized users, generated programmatically from slider values.
- **Layer 3 — CONTEXT_MODIFIER**: Per surface. Telegram reply: no modifier. Proactive check-in: "This is a proactive message you're initiating. Keep it to 2–3 sentences. Be curious, not pushy." Weekly summary: "Organize what you know about their week: what they worked on, what's still open, one question about next week."

Plus a dynamic `USER_CONTEXT_BLOCK` assembled at call time: active goals, last message date, recent entities.

**P7-02: Define the 6 preset overlays**

| Preset | Voice spec |
|---|---|
| Coach | Direct, accountability-focused, push-mode. Second-person address. Short sentences. Calls out avoidance. No softening. |
| Buddy | Warm, casual, friend energy. Informal language, contractions, occasional emoji. Cares about the person not just their output. |
| Assistant | Professional, structured, neutral. Organized responses. |
| Wise-ass | Dry, sarcastic, observational. Never mean-spirited — sharp but not cruel. |
| Unhinged | Chaos energy, lowercase, terminally online voice. |
| Hype Bird | Maximum encouragement, exclamation, championship framing. |

**P7-03: Slider-to-overlay derivation**

Document the mapping from each of the 8 slider axes (professional, friendly, unhinged, creative, direct, humor, analytical, supportive) to natural-language voice instructions. Keep it consistent so power users who fine-tune sliders get predictable results.

**P7-04: Personality preview test harness**

CLI script or debug-only dashboard route. Input: any sample message context. Output: rendered response across all 6 personalities side-by-side. Used by Nick to tune overlays without deploying. This must be built — voice quality is subjective and needs to be read before shipping.

**P7-05: Pre-write dashboard empty state copy**

File: `src/lib/emptyStates.ts`

Static constants — 6 personality sets × ~5 strings per tab. No LLM at runtime for empty states. The Bird's voice in the UI is copy, not inference.

### Sprint P7 Definition of Done

Every outbound Telegram message and dashboard empty state reflects the user's selected personality. Switching personalities in Settings immediately changes the voice. The preview harness lets Nick tune overlays without redeploying. Nick has approved the overlay copy for all 6 presets.

---

## Sprint P8 — Goals + Proactive Check-ins + Weekly Summary 📋 PLANNED

**Owner:** Claude Code
**Goal:** The Bird stops being purely reactive. It checks in on goals on a sensible cadence and sends a weekly briefing.

### Tasks

**P8-01: Goal extraction in P2 pipeline**

When extraction finds a goal-type entity, also create a `Goal` record. Apply the confidence gate (P2-04): high confidence → `active`, low confidence → `pending_confirmation`. Link `Goal.entityId` to the Entity row for graph navigation.

**P8-02: Pending-confirmation conversation flow**

When a Goal exists with `status: pending_confirmation`, queue a clarifying message in the Bird's next reply. User confirms ("yes track that") → flip to `active`. User declines ("nah just thinking out loud") → flip to `abandoned`. No check-ins fire until confirmed.

**P8-03: Proactive check-in cron**

Trigger.dev scheduled task, runs once daily at 17:00 UTC.

Algorithm per user:
1. Check global daily cap: if any goal received a check-in in the last 22 hours, skip this user (22h not 24h — accommodates DST drift)
2. Get all `active` goals
3. For each, compute overdue ratio: `days_since_last_checkin / cadence_days` (where cadence_days = `{daily: 1, weekly: 7, biweekly: 14, monthly: 30}`)
4. If no goals have overdue ratio ≥ 1, skip
5. Pick the most-overdue goal (highest ratio)
6. Send one personality-aware check-in message via Telegram
7. Update `Goal.lastCheckinAt`

Hard rules:
- Max one check-in per user per day, even if 5 goals are overdue
- Goals with `status` other than `active` are skipped
- `globalCheckinEnabled: false` on `UserPreferences` skips the user entirely

**P8-04: Weekly summary cron**

Trigger.dev scheduled task, runs Mondays at 13:00 UTC (8am Eastern, 5am Pacific).

For each user with a Telegram connection:
- Synthesize last week's activity from graph (entities created, decisions made, goals progressed)
- Send personality-aware weekly briefing
- Tone: "here's what's open from last week, what are you working on this week?"
- This replaces the dashboard Home tab idea entirely — the summary lives in Telegram

**P8-05: Per-goal check-in settings**

Goals tab in dashboard exposes cadence + pause toggle per goal. Global pause toggle in Settings (`UserPreferences.globalCheckinEnabled`). User must always be able to silence the Bird quickly.

### Sprint P8 Definition of Done

Active goals receive periodic check-ins via Telegram, capped at one per user per day, on each goal's configured cadence. Users get a weekly summary every Monday morning. Both can be paused per-goal or globally. Confirmation flow prevents low-confidence goals from triggering check-ins without user sign-off.

---

## Sprint P5 — Dashboard + 2-Step Onboarding + Landing Page 📋 PLANNED

> **Re-scope — 2026-04-24:** MVP shipping with 2 tabs (Memory + Integrations). Goals tab is fully built (API routes, page, components) but hidden from nav — will be re-enabled based on user feedback post-launch. Action wiring (pause/complete/abandon via ⋯ menu and pending card buttons) was never finished — stub state only. Reactivate by restoring the Goals nav item in `Sidebar.tsx` and `BottomTabBar.tsx`, then shipping the original commit 5 (action wiring). Rationale: post-launch decisions should be driven by user feedback, not pre-launch speculation.

**Owner:** Nick + Claude Code
**Goal:** Build the user-facing surfaces. The dashboard is for reviewing what the Bird captured. The landing page sells the Bird as a character. Onboarding is 2 steps and under 60 seconds.

This sprint is intentionally last. The landing page copy depends on the actual Bird being real. Build the product, then write the marketing.

### Tasks

**P5-01: 2-step onboarding flow**

Repurpose `WizardContext.tsx` and wizard step structure from `src/components/onboarding/` (moved in P0, refactored for Bird in this sprint).

Step 1: **Pick your Bird's personality**
- 6 preset cards: icon, name, tagline, sample message showing the voice
- Single-select, required
- "Customize" expand link below grid reveals the 8-slider panel (uses `TraitSlider.tsx`)
- Stores selection to `UserPreferences.personalityPreset`

Step 2: **Connect on Telegram**
- Generate pairing token via `POST /api/telegram/pair`
- Display deep link as a tap-to-open button + QR code
- Poll `GET /api/telegram/status` every 3 seconds
- Auto-advance when connection is confirmed
- The Bird sends its first in-character message (drafted in P6-07) as part of the pairing confirmation

Drop everything from the old wizard: naming the Bird, model selection, channel selection, focus areas.

**P5-02: Dashboard layout — 5 tabs**

Tabs: Memory (default), Graph, Goals, Integrations, Settings

Sidebar: BirdBot mascot/branding in header. Empty states use pre-written personality copy from `src/lib/emptyStates.ts` (P7-05).

**P5-03: Memory tab**
- Chronological feed of captures (text, voice transcripts, photos)
- Filterable by entity type, source (Telegram/MCP), date range
- Searchable
- Each item: timestamp, source, extracted entities

**P5-04: Graph tab (committed deliverable)**

D3 force-directed graph of entities + relationships. Click a node → side panel with entity details and connections. No advanced filtering or clustering in v1 — basic visualization done well. This is a key differentiator vs. Memorae's flat feed. Do not cut.

**P5-05: Goals tab**
- Active goals: status, last check-in, cadence, target date
- Edit, pause, mark complete, abandon
- Per-goal cadence settings
- Confirmation queue for `pending_confirmation` goals (separate section from active list)

**P5-06: Integrations tab**
- Telegram (connected by default after onboarding — shows status, disconnect option)
- MCP (instructions to install birdbot-mcp + connect to Claude Code/Cursor)
- Google Calendar, Gmail, GitHub — "coming soon" placeholders
- Framing: "more surfaces for your Bird"

**P5-07: Settings**
- Personality: change preset, expand to sliders
- Check-in cadence + global pause
- Telegram connection management (disconnect, re-pair)
- Account/billing (existing Clerk + Stripe)
- Danger zone (delete account + all data)

**P5-08: Landing page rewrite**
- Throw out the old "managed agent hosting" copy
- New framing: "Meet your Bird. It remembers everything. Plugs into every tool you use."
- Hero: Bird character + "Text your Bird" demo interaction
- Features: capture from anywhere, persistent memory, proactive companion, MCP for coding agents
- How it works: 3 steps (sign up → pick personality → text your Bird)
- Pricing: deferred — "join the waitlist" or single-tier paid until pricing is finalized
- Audience: speaks directly to builder/founders

### Sprint P5 Definition of Done

A new user signs up, completes 2-step onboarding in under 60 seconds, lands in the Memory tab, and can see messages they've sent the Bird. All 5 tabs are functional. Landing page positions the Bird as a character, not a database. Graph visualization works. The full end-to-end loop (sign up → pick personality → pair Telegram → see first Bird message) works without manual intervention.

---

## Launch — After P5

End-to-end smoke test: sign up → pick personality → pair Telegram → receive Bird's first message → text the Bird 5–10 things → see them appear in Memory and Graph → set a goal → wait for check-in → review weekly summary on Monday → install birdbot-mcp → query the graph from Claude Code.

When that loop is solid, soft-launch to the waitlist.

---

## Pricing & Billing — Deferred

Current Stripe tiers ($19/$39/$79) were priced for Hetzner-hosted agents that no longer exist. Without provisioning, COGS per user is approximately $1–3/month (LLM calls + Telegram + storage). New pricing: free tier + one paid tier, but actual prices, feature splits, and free-tier limits are decided after there is real usage data.

When pricing is finalized: recreate Stripe price IDs, update `PLANS` constant in `src/lib/stripe.ts`, wire the deferred webhook DB writes (Subscription table already exists), update landing page pricing section.

---

## Out of Scope for v1 (tracked here for later)

- Additional capture surfaces: WhatsApp, SMS via Twilio, email
- Google Calendar integration (read events into graph, create events from chat)
- Gmail integration (Bird drafts replies, surfaces important threads)
- Mobile-optimized dashboard
- Surface-based personality (different preset in Telegram vs. MCP)
- Timezone support for check-in scheduling (UserPreferences.timezone, deferred)
- Per-user analytics
- Voice mode (Bird sends voice notes back)
- Remote MCP transport (streamable HTTP at api.birdbot.ai/mcp for Cursor/Windsurf)
- Team workspaces (shared graph, multi-user write access)
