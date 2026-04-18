# MVP Redesign — Projects Brain Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Date:** 2026-04-18
**Status:** Approved

---

## Overview

Redesign the BirdBot dashboard MVP around one core loop: user creates a project, pastes a prompt into their coding tool, and sessions + decisions sync automatically to their dashboard. The dashboard becomes a read-only brain for each project — showing session history and logged decisions.

Remove everything that doesn't serve this loop: the 4-step agent creation wizard, the incubating gate, and the onboarding checklist.

---

## Section 1 — Architecture

### The complete loop

```
User creates project (names it in dashboard)
  → Gets personalized prompt (token + project name pre-filled)
  → Pastes into CLAUDE.md or coding tool system instructions

Every coding session:
  AI calls GET /api/mcp/briefing?project=<name>
    → BirdBot reads past sessions + decisions from Neon
    → Synthesizes briefing using BirdBot's Anthropic key
    → Returns { briefing, sessionId }
  AI works, logs decisions via POST /api/mcp/decisions
  AI logs summary at end via POST /api/mcp/sessions

Dashboard:
  Projects tab → project cards → sessions list → session detail + decisions
```

### Auth split (unchanged)

- Sync endpoints (`/api/mcp/*`) — Bearer token auth, called from coding tool
- Dashboard endpoints (`/api/projects/*`) — Clerk auth, called from browser

### BirdBot provides the Anthropic key

The briefing endpoint runs server-side using BirdBot's own `ANTHROPIC_API_KEY`. Users do not need to provide an API key.

---

## Section 2 — New API Endpoint: `GET /api/mcp/briefing`

**File:** `src/app/api/mcp/briefing/route.ts`

### Auth

Same pattern as existing MCP endpoints: read `Authorization: Bearer <token>`, look up `McpConnection`, reject 401 if not found.

### Request

```
GET /api/mcp/briefing?project=birdbot-cloud
Authorization: Bearer tok_xxxxxxxx
```

`project` query param is required. Return 400 if missing.

### Behavior

1. Look up `McpConnection` by token → get `userToken`
2. Query Neon in parallel:
   - Last 10 `CloudSession` rows for `{ userToken, project }`, ordered by `createdAt desc`
   - Last 50 `CloudDecision` rows for `{ userToken, project }`, ordered by `createdAt desc`
3. Call `synthesizeBriefing(sessions, decisions, project)` — port this function from `birdbot-mcp/src/synthesis.ts` into `src/lib/synthesis.ts` unchanged. Uses `process.env.ANTHROPIC_API_KEY` (BirdBot's key).
4. Generate `sessionId = crypto.randomUUID()`
5. Return:

```json
{
  "briefing": "Last session you wired up the Stripe webhook...",
  "sessionId": "uuid-v4"
}
```

If no history yet, `synthesizeBriefing` returns the "first session" message — same behaviour as local birdbot-mcp today.

### Synthesis function

Copy `synthesizeBriefing` from `birdbot-mcp/src/synthesis.ts` to `src/lib/synthesis.ts`. Remove the startup `ANTHROPIC_API_KEY` guard (server always has it). Keep the model, prompt, and rules identical.

---

## Section 3 — The Copyable Prompt

When a user creates a project (or visits the Connect page), they see this prompt — fully personalized, nothing to edit:

```
## BirdBot Memory

You have access to BirdBot — a persistent memory layer for this project.

At the START of every session, call:
  GET https://app.birdbot.ai/api/mcp/briefing?project=<projectName>
  Authorization: Bearer <userToken>
Read the returned briefing as your project context.
Use the returned sessionId in all subsequent BirdBot calls this session.

When you make a significant architectural decision, call:
  POST https://app.birdbot.ai/api/mcp/decisions
  Authorization: Bearer <userToken>
  { "project": "<projectName>", "sessionId": "<sessionId>", "decision": "...", "reasoning": "..." }

At the END of every session, call:
  POST https://app.birdbot.ai/api/mcp/sessions
  Authorization: Bearer <userToken>
  { "project": "<projectName>", "sessionId": "<sessionId>", "summary": "..." }
```

`<projectName>` and `<userToken>` are substituted server-side before display.

A "Copy" button copies the full prompt. A "Prefer MCP config instead?" toggle below switches to the existing MCP JSON snippet for users who prefer it.

---

## Section 4 — Dashboard Changes

### Routing

`/dashboard` → redirect to `/dashboard/projects`. No separate home page.

**File:** `src/app/dashboard/page.tsx` — replace content with a `redirect('/dashboard/projects')`.

### Remove the incubating gate and wizard

**File:** `src/app/dashboard/layout.tsx` — remove the `IncubatingGate` and `AgentSetupWizard` imports and their JSX. User is active the moment they sign up.

**Delete these files:**
- `src/components/dashboard/AgentSetupWizard.tsx`
- `src/components/dashboard/IncubatingGate.tsx`
- `src/components/dashboard/WizardContext.tsx`
- `src/components/wizard/FocusAreaGrid.tsx`
- `src/components/wizard/ModelSelector.tsx`
- `src/components/wizard/TraitSlider.tsx`

The `Agent` table and provisioning infrastructure are left untouched in the DB and backend — only the UI is removed.

### Projects tab (`/dashboard/projects`)

**File:** `src/app/dashboard/projects/page.tsx`

Changes:
- Remove the onboarding checklist section entirely
- Add "New Project" button (top right of the page)
- Clicking "New Project" opens a modal:
  1. Text input: "Project name" (e.g. `birdbot-cloud`)
  2. On submit: show the personalized prompt (Section 3) with a Copy button and a "Done" button
- Empty state (no projects yet): "Create your first project to get started" + "New Project" button
- Project cards (existing behaviour): auto-appear when sessions sync, navigate to session list on click

### Connect page (`/dashboard/connect`)

**File:** `src/app/dashboard/connect/page.tsx`

Replace the existing MCP config tab UI with:
- Heading: "Connect your coding tool"
- If the user has existing projects: a dropdown to select which project, then the personalized prompt for that project with a Copy button
- If no projects exist yet: a prompt to create a project first ("Create a project in the Projects tab to get your connection prompt")
- "Prefer MCP config instead?" toggle — reveals the existing MCP JSON snippet below

### Settings page

No changes. Already handled via the bottom nav account controls.

---

## Section 5 — What Is Not Changing

- All existing `/api/projects/*` dashboard endpoints — no changes
- All existing `/api/mcp/sessions` and `/api/mcp/decisions` sync endpoints — no changes
- Prisma schema — no new tables or columns needed
- Sidebar navigation structure (Projects, Connect, Chat, Settings) — no changes
- `birdbot-mcp` npm package — no changes needed for this redesign

---

## Testing

- Unit test for `GET /api/mcp/briefing`: valid token + project returns `{ briefing, sessionId }`, missing project returns 400, invalid token returns 401, no history returns first-session message
- Manual smoke test: create project in dashboard → copy prompt → paste into CLAUDE.md → start Claude Code session → verify briefing returned → verify session + decisions appear in dashboard
