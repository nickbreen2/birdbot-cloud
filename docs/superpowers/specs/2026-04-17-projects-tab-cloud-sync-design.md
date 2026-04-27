# Projects Tab + Cloud Sync Design

**Date:** 2026-04-17
**Status:** Approved

---

## Overview

Sync decisions and sessions from the user's local birdbot-mcp SQLite database to Neon (cloud Postgres), and display them in the dashboard's Projects tab as a three-level drill-down: Projects → Sessions → Session detail with decisions.

This gives users a read-only view of their AI-assisted development history directly in the dashboard.

---

## Section 1 — Data Model

### birdbot-mcp local changes (v0.1.4)

Add a nullable `session_id` column to both SQLite tables:

```sql
ALTER TABLE sessions ADD COLUMN session_id TEXT;
ALTER TABLE decisions ADD COLUMN session_id TEXT;
```

`get_briefing` generates a UUID `session_id` and includes it in the returned briefing text. The AI uses this value when calling `log_decision` and `log_session_end` throughout the session. This cleanly links all decisions to the session they belong to without requiring a foreign key lookup.

`session_id` is nullable so existing rows and any future calls that omit it degrade gracefully.

### Cloud Postgres new tables (Neon)

**CloudSession**
```
id            String   @id @default(cuid())
userToken     String               -- BIRDBOT_USER_TOKEN, links to McpConnection
project       String               -- repo/folder name from birdbot-mcp
sessionId     String   @unique     -- UUID from get_briefing
summary       String?
createdAt     DateTime
syncedAt      DateTime @default(now())
```

**CloudDecision**
```
id            String   @id @default(cuid())
userToken     String
project       String
sessionId     String?              -- links to CloudSession.sessionId (nullable)
decision      String
reasoning     String?
createdAt     DateTime
syncedAt      DateTime @default(now())
```

Both tables are keyed by `userToken` (not Clerk userId) — the sync endpoints are called from birdbot-mcp, which only knows the user token, not the Clerk session.

---

## Section 2 — API Endpoints

### Sync endpoints — token auth (called from birdbot-mcp)

Auth pattern: same as existing `/api/mcp/ping` — read `Authorization: Bearer <token>` header, look up `McpConnection` row, reject 401 if not found.

**`POST /api/mcp/sessions`**

Request body:
```json
{
  "project": "birdbot-cloud",
  "sessionId": "uuid-v4",
  "summary": "Built connection detection — McpConnection table...",
  "createdAt": "2026-04-17T10:00:00.000Z"
}
```

Behavior: upsert on `sessionId` (idempotent — birdbot-mcp may retry). Returns `{ ok: true }`.

**`POST /api/mcp/decisions`**

Request body:
```json
{
  "project": "birdbot-cloud",
  "sessionId": "uuid-v4",
  "decision": "Use fire-and-forget fetch for MCP ping",
  "reasoning": "Briefing must always return regardless of network state.",
  "createdAt": "2026-04-17T10:05:00.000Z"
}
```

Behavior: create row. `sessionId` is optional — if omitted, decision is stored unlinked. Returns `{ ok: true }`.

### Dashboard endpoints — Clerk auth (called from the dashboard)

Standard `auth()` from `@clerk/nextjs/server`. Look up `McpConnection` by `clerkUserId` to get the user's token, then query `CloudSession`/`CloudDecision` by that token. If no `McpConnection` row exists (user hasn't connected yet), return an empty result set — not a 404.

**`GET /api/projects`**

Returns all distinct projects for the authenticated user, with session and decision counts.

Response:
```json
{
  "projects": [
    { "name": "birdbot-cloud", "sessionCount": 12, "decisionCount": 8, "lastSessionAt": "2026-04-17T..." },
    { "name": "birdbot-mcp",   "sessionCount": 5,  "decisionCount": 3,  "lastSessionAt": "2026-04-15T..." }
  ]
}
```

**`GET /api/projects/[project]/sessions`**

Returns all sessions for a project, newest first.

Response:
```json
{
  "sessions": [
    { "sessionId": "uuid", "summary": "...", "decisionCount": 3, "createdAt": "..." }
  ]
}
```

**`GET /api/projects/[project]/sessions/[sessionId]`**

Returns one session with its linked decisions.

Response:
```json
{
  "session": {
    "sessionId": "uuid",
    "project": "birdbot-cloud",
    "summary": "...",
    "createdAt": "...",
    "decisions": [
      { "id": "...", "decision": "...", "reasoning": "...", "createdAt": "..." }
    ]
  }
}
```

---

## Section 3 — Dashboard UI

Three pages inside `/dashboard/projects/`:

### Page 1 — `/dashboard/projects` (modify existing)

File: `src/app/dashboard/projects/page.tsx`

Keep the existing onboarding checklist at the top. Below it, add a "Your Projects" section that fetches from `GET /api/projects` and renders a grid of project cards. Each card shows: project name, session count, decision count, last session date. Clicking navigates to Page 2.

If no projects exist yet, show a placeholder: "No projects yet — start a session in Claude to see your work here."

### Page 2 — `/dashboard/projects/[project]` (new)

File: `src/app/dashboard/projects/[project]/page.tsx`

Breadcrumb: `← Projects / [project name]`

Fetches from `GET /api/projects/[project]/sessions`. Renders sessions as a list, newest first. Each row shows: date, session summary (truncated), decision count. Clicking navigates to Page 3.

### Page 3 — `/dashboard/projects/[project]/sessions/[sessionId]` (new)

File: `src/app/dashboard/projects/[project]/sessions/[sessionId]/page.tsx`

Breadcrumb: `← [project] / [date]`

Fetches from `GET /api/projects/[project]/sessions/[sessionId]`. Renders:
- Session summary card at the top
- "Decisions logged this session" list below — each decision shows the decision text and reasoning

---

## Section 4 — birdbot-mcp changes (v0.1.4)

### `src/db.ts`

Add `session_id TEXT` column to both tables (nullable, added via `ALTER TABLE` on init so existing DBs upgrade automatically).

Update `logDecision(project, decision, reasoning, sessionId?)` and `logSessionEnd(project, summary, sessionId?)` signatures.

### `src/index.ts`

**`get_briefing`:** Generate `session_id = crypto.randomUUID()` at the top. Append to the returned briefing string: `"Session ID: <uuid> — include this in log_decision and log_session_end calls."` Fire-and-forget is already in place for ping; no change to that.

**`log_decision`:** Accept optional `session_id` param. After writing to SQLite, fire-and-forget POST to `/api/mcp/decisions`.

**`log_session_end`:** Accept optional `session_id` param. After writing to SQLite, fire-and-forget POST to `/api/mcp/sessions`.

Both sync calls use the existing `BIRDBOT_CLOUD_URL` + `BIRDBOT_USER_TOKEN` env vars (already in place).

---

## Out of Scope

- Editing or deleting decisions from the dashboard
- Real-time updates (polling or websockets)
- Decisions not linked to a session (unlinked decisions are stored but not shown in the session detail view)
- Token rotation

---

## Testing

- Unit tests for all 5 new API routes (vitest, same pattern as existing tests)
- Manual smoke test: run `get_briefing` → `log_decision` → `log_session_end` in Claude, verify rows appear in the dashboard
