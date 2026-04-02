# Prisma Database Layer — Design Spec

**Date:** 2026-04-01
**Status:** Implemented

## Context

The app had a Neon Postgres database configured in `.env.local` but no ORM or schema. Two data needs existed:

1. **Waitlist signups** — `WaitlistCTA.tsx` mocked a `setTimeout` with no real persistence.
2. **Agent configurations** — `POST /api/agents/create` wrote to Clerk `publicMetadata`, which was a temporary solution.

Goal: add Prisma 7 (with Neon driver adapter), define both tables, implement the waitlist API, and fully migrate agent config reads + writes to Postgres.

Agents support **multiple per user** (Power plan = 2 agents).

---

## Architecture

### ORM Setup

- **Prisma 7** with `@prisma/adapter-neon` + `@neondatabase/serverless`
- Prisma 7 requires a driver adapter (no built-in database drivers)
- Generated client at `src/generated/prisma/` (Prisma 7 default)
- Singleton at `src/lib/prisma.ts`

### Connection

- `DATABASE_URL` — Neon pooler URL (runtime queries)
- `DIRECT_URL` — Neon direct URL (migrations/db push), set in `schema.prisma`'s `directUrl`
- Datasource `url` managed via `prisma.config.ts`; `directUrl` in `schema.prisma`

---

## Schema

```prisma
model WaitlistEntry {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())
}

model Agent {
  id          String   @id @default(cuid())
  clerkUserId String
  name        String
  model       String
  traits      Json
  focusAreas  String[]
  channels    String[]
  status      String   @default("incubating")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([clerkUserId])
}
```

- `WaitlistEntry.email` is `@unique` — duplicate submissions use upsert (silent no-op)
- `Agent.traits` is `Json` — matches the `Traits` type from `src/types/wizard.ts`
- No `User` table; `clerkUserId` is the join key to Clerk
- `onboarded` is derived: `agents.length > 0`

---

## API Changes

| Route | Change |
|-------|--------|
| `POST /api/waitlist` | New — inserts/upserts `WaitlistEntry` |
| `POST /api/agents/create` | Updated — writes to `Agent` table (removed Clerk metadata write) |
| `GET /api/agents` | New — returns `{ agents[], onboarded: boolean }` for authenticated user |

---

## Component Changes

### `WizardContext.tsx`
Extended to own the `/api/agents` fetch. Exposes:
- `agents: AgentData[]`
- `onboarded: boolean`
- `agentsLoaded: boolean`
- `refreshAgents: () => void`

Both `AgentSetupWizard` and `IncubatingGate` read from context — single fetch, shared state.

### `AgentSetupWizard.tsx`
- Removed `useUser()` from Clerk
- `agentsLoaded` replaces `isLoaded` for blocking overlay
- `onboarded` from context replaces `user.publicMetadata.onboarded`
- `agents[0]` replaces `user.publicMetadata.agent` for pre-populating edit mode
- `refreshAgents()` called after successful deploy

### `IncubatingGate.tsx`
- Removed `useUser()` from Clerk
- `agentsLoaded`/`onboarded`/`agents[0]?.name` from context replace all Clerk metadata reads

---

## Verification

1. `npx prisma db push` — confirm tables in Neon console
2. `npx prisma studio` — visually inspect schema
3. Submit waitlist email → check `WaitlistEntry` row; re-submit → no error
4. Complete wizard → check `Agent` row with `status = 'incubating'`
5. Reload dashboard after deploy → incubating gate shows, wizard does not re-open
6. Unauthenticated request to `GET /api/agents` → 401
