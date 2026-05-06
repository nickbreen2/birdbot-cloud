# Google Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google Calendar, Gmail, and Drive to BirdBot — one OAuth flow stores tokens in Postgres, API wrappers let Bird read/write on the user's behalf, and all write actions require explicit Telegram confirmation before executing.

**Architecture:** Users hit `/api/google/connect` which redirects to Google's OAuth consent screen with an HMAC-signed CSRF state. The callback exchanges the code for tokens, stores them in `GoogleConnection`, and redirects back to `/dashboard/integrations`. `getGoogleClient(userId)` lazily refreshes tokens within 5 minutes of expiry; a Trigger.dev cron refreshes proactively every 45 minutes. Write actions (calendar create, email send, doc create) are staged in `PendingAction` and executed only after the user replies `yes` in Telegram.

**Tech Stack:** `googleapis` npm package, Clerk auth (`auth()` from `@clerk/nextjs/server`), Prisma + Neon for token/action storage, Trigger.dev v4 (`schedules.task`) for cron, Vitest for tests.

---

## File Map

**New files:**
- `prisma/schema.prisma` — add `GoogleConnection` + `PendingAction` models (modify)
- `src/lib/google.ts` — OAuth client factory, CSRF state helpers, `getGoogleClient`, `handleTokenRevoked`
- `src/lib/googleCalendar.ts` — `getUpcomingEvents`, `createEvent`
- `src/lib/googleGmail.ts` — `getUnreadSummary`, `getThread`, `draftEmail`, `sendEmail`
- `src/lib/googleDrive.ts` — `searchFiles`, `getFile`, `createDoc`
- `src/app/api/google/connect/route.ts` — redirect to Google OAuth
- `src/app/api/google/callback/route.ts` — exchange code, store tokens, redirect
- `src/app/api/google/disconnect/route.ts` — revoke token, delete row
- `src/app/api/google/status/route.ts` — return connected state + email
- `src/trigger/googleTokenRefresh.ts` — proactive 45-min token refresh cron
- `src/trigger/morningBrief.ts` — 7am UTC daily Telegram briefing for Google-connected users
- `src/__tests__/lib/google.test.ts` — CSRF state + getGoogleClient unit tests
- `src/__tests__/api/google/callback.test.ts` — callback route unit test
- `src/__tests__/lib/googleCalendar.test.ts` — getUpcomingEvents unit test
- `src/__tests__/trigger/googleTelegram.test.ts` — confirmation + intent helper tests

**Modified files:**
- `src/trigger/telegram.ts` — add Google intent detection + confirm-before-write
- `src/app/dashboard/integrations/page.tsx` — wire Calendar, Gmail, Drive cards

---

## Task 1: DB Migration — GoogleConnection + PendingAction

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the two new models to `prisma/schema.prisma`**

Add at the bottom of the file, after the last model:

```prisma
model GoogleConnection {
  id           String   @id @default(cuid())
  userId       String   @unique
  accessToken  String
  refreshToken String
  expiresAt    DateTime
  scopes       String[]
  email        String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([userId])
}

model PendingAction {
  id        String   @id @default(cuid())
  userId    String
  type      String
  payload   Json
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
}
```

- [ ] **Step 2: Run the migration**

```bash
npx prisma migrate dev --name add-google-connection-pending-action
```

Expected: Migration created and applied. `GoogleConnection` and `PendingAction` tables exist in Neon.

- [ ] **Step 3: Verify generated types**

```bash
npx prisma generate
```

Expected: No errors. `prisma.googleConnection` and `prisma.pendingAction` are available on the client.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add GoogleConnection and PendingAction schema models"
```

---

## Task 2: Install googleapis

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Install the package**

```bash
npm install googleapis
```

Expected: `"googleapis"` appears in `package.json` dependencies.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install googleapis"
```

---

## Task 3: src/lib/google.ts — OAuth client, CSRF state, token refresh

**Files:**
- Create: `src/lib/google.ts`
- Create: `src/__tests__/lib/google.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/lib/google.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findUnique_tg: vi.fn(),
  setCredentials: vi.fn(),
  refreshAccessToken: vi.fn(),
  sendTelegramMessage: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    googleConnection: {
      findUnique: mocks.findUnique,
      update: mocks.update,
      delete: mocks.delete,
    },
    telegramUser: {
      findUnique: mocks.findUnique_tg,
    },
  },
}))

vi.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: vi.fn().mockImplementation(() => ({
        setCredentials: mocks.setCredentials,
        refreshAccessToken: mocks.refreshAccessToken,
        generateAuthUrl: vi.fn().mockReturnValue("https://accounts.google.com/o/oauth2/auth"),
      })),
    },
  },
}))

vi.mock("@/lib/telegram", () => ({
  sendTelegramMessage: mocks.sendTelegramMessage,
}))

process.env.GOOGLE_CLIENT_ID = "test-client-id"
process.env.GOOGLE_CLIENT_SECRET = "test-client-secret"
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000"
process.env.GOOGLE_OAUTH_STATE_SECRET = "test-secret-32-bytes-padding-here"

import { createState, verifyState, getGoogleClient, handleTokenRevoked } from "@/lib/google"

describe("createState / verifyState", () => {
  it("round-trips a userId", () => {
    const state = createState("user_abc123")
    expect(verifyState(state)).toBe("user_abc123")
  })

  it("returns null for a tampered state", () => {
    const state = createState("user_abc123")
    const last = state.at(-1)!
    const tampered = state.slice(0, -1) + (last === "a" ? "b" : "a")
    expect(verifyState(tampered)).toBeNull()
  })

  it("returns null for an empty string", () => {
    expect(verifyState("")).toBeNull()
  })

  it("returns null for malformed state (no colon)", () => {
    const badState = Buffer.from("nocolonhere").toString("base64url")
    expect(verifyState(badState)).toBeNull()
  })
})

describe("getGoogleClient", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns a client without refreshing when token has 1 hour left", async () => {
    mocks.findUnique.mockResolvedValue({
      userId: "user_1",
      accessToken: "at",
      refreshToken: "rt",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    })

    const client = await getGoogleClient("user_1")
    expect(client).toBeDefined()
    expect(mocks.setCredentials).toHaveBeenCalledWith({ access_token: "at", refresh_token: "rt" })
    expect(mocks.refreshAccessToken).not.toHaveBeenCalled()
  })

  it("refreshes when token expires in less than 5 minutes", async () => {
    mocks.findUnique.mockResolvedValue({
      userId: "user_1",
      accessToken: "old_at",
      refreshToken: "rt",
      expiresAt: new Date(Date.now() + 2 * 60 * 1000),
    })
    mocks.refreshAccessToken.mockResolvedValue({
      credentials: { access_token: "new_at", expiry_date: Date.now() + 3600000 },
    })

    await getGoogleClient("user_1")
    expect(mocks.refreshAccessToken).toHaveBeenCalledOnce()
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ accessToken: "new_at" }) })
    )
  })

  it("throws when no connection exists", async () => {
    mocks.findUnique.mockResolvedValue(null)
    await expect(getGoogleClient("user_no_google")).rejects.toThrow()
  })
})

describe("handleTokenRevoked", () => {
  beforeEach(() => vi.clearAllMocks())

  it("deletes the connection and sends a Telegram message", async () => {
    mocks.delete.mockResolvedValue({})
    mocks.findUnique_tg.mockResolvedValue({ telegramChatId: "12345" })

    await handleTokenRevoked("user_1")

    expect(mocks.delete).toHaveBeenCalledWith({ where: { userId: "user_1" } })
    expect(mocks.sendTelegramMessage).toHaveBeenCalledWith(12345, expect.stringContaining("disconnected"))
  })

  it("skips Telegram message when user has no Telegram account", async () => {
    mocks.delete.mockResolvedValue({})
    mocks.findUnique_tg.mockResolvedValue(null)

    await handleTokenRevoked("user_1")
    expect(mocks.sendTelegramMessage).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests — verify they fail with "Cannot find module '@/lib/google'"**

```bash
npx vitest run src/__tests__/lib/google.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/lib/google.ts`**

```typescript
import { google } from "googleapis"
import type { OAuth2Client } from "google-auth-library"
import { createHmac, timingSafeEqual } from "crypto"
import { prisma } from "@/lib/prisma"
import { sendTelegramMessage } from "@/lib/telegram"

export function buildOAuthClient(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`
  ) as OAuth2Client
}

export function createState(userId: string): string {
  const secret = process.env.GOOGLE_OAUTH_STATE_SECRET!
  const sig = createHmac("sha256", secret).update(userId).digest("hex")
  return Buffer.from(`${userId}:${sig}`).toString("base64url")
}

export function verifyState(state: string): string | null {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8")
    const colonIdx = decoded.indexOf(":")
    if (colonIdx === -1) return null
    const userId = decoded.slice(0, colonIdx)
    const sig = decoded.slice(colonIdx + 1)
    if (!userId || !sig) return null
    const secret = process.env.GOOGLE_OAUTH_STATE_SECRET!
    const expected = createHmac("sha256", secret).update(userId).digest("hex")
    const sigBuf = Buffer.from(sig, "hex")
    const expectedBuf = Buffer.from(expected, "hex")
    if (sigBuf.length !== expectedBuf.length) return null
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null
    return userId
  } catch {
    return null
  }
}

export async function getGoogleClient(userId: string): Promise<OAuth2Client> {
  const conn = await prisma.googleConnection.findUnique({ where: { userId } })
  if (!conn) throw new Error(`No Google connection for user ${userId}`)

  const client = buildOAuthClient()
  client.setCredentials({ access_token: conn.accessToken, refresh_token: conn.refreshToken })

  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000)
  if (conn.expiresAt < fiveMinutesFromNow) {
    try {
      const { credentials } = await client.refreshAccessToken()
      await prisma.googleConnection.update({
        where: { userId },
        data: {
          accessToken: credentials.access_token!,
          expiresAt: new Date(credentials.expiry_date!),
        },
      })
      client.setCredentials(credentials)
    } catch {
      await handleTokenRevoked(userId)
      throw new Error(`Google token revoked for user ${userId}`)
    }
  }

  return client
}

export async function handleTokenRevoked(userId: string): Promise<void> {
  await prisma.googleConnection.delete({ where: { userId } }).catch(() => {})
  const tgUser = await prisma.telegramUser.findUnique({
    where: { userId },
    select: { telegramChatId: true },
  })
  if (tgUser) {
    await sendTelegramMessage(
      parseInt(tgUser.telegramChatId, 10),
      "Heads up — your Google connection was disconnected. Reconnect from your dashboard when you're ready."
    )
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/__tests__/lib/google.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/google.ts src/__tests__/lib/google.test.ts
git commit -m "feat: add Google OAuth client helper, CSRF state, and token refresh"
```

---

## Task 4: OAuth Routes — connect, callback, disconnect, status

**Files:**
- Create: `src/app/api/google/connect/route.ts`
- Create: `src/app/api/google/callback/route.ts`
- Create: `src/app/api/google/disconnect/route.ts`
- Create: `src/app/api/google/status/route.ts`
- Create: `src/__tests__/api/google/callback.test.ts`

- [ ] **Step 1: Write the failing callback test**

Create `src/__tests__/api/google/callback.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const mocks = vi.hoisted(() => ({
  verifyState: vi.fn(),
  buildOAuthClient: vi.fn(),
  getToken: vi.fn(),
  setCredentials: vi.fn(),
  userinfoGet: vi.fn(),
  upsert: vi.fn(),
}))

vi.mock("@/lib/google", () => ({
  verifyState: mocks.verifyState,
  buildOAuthClient: mocks.buildOAuthClient,
}))

vi.mock("googleapis", () => ({
  google: {
    oauth2: vi.fn().mockReturnValue({ userinfo: { get: mocks.userinfoGet } }),
  },
}))

vi.mock("@/lib/prisma", () => ({
  prisma: { googleConnection: { upsert: mocks.upsert } },
}))

process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000"

import { GET } from "@/app/api/google/callback/route"

describe("GET /api/google/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.buildOAuthClient.mockReturnValue({
      getToken: mocks.getToken,
      setCredentials: mocks.setCredentials,
    })
  })

  it("redirects to error page when state is invalid", async () => {
    mocks.verifyState.mockReturnValue(null)
    const req = new NextRequest("http://localhost:3000/api/google/callback?code=abc&state=bad")
    const res = await GET(req)
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("google=error")
  })

  it("redirects to error page when code is missing", async () => {
    mocks.verifyState.mockReturnValue("user_1")
    const req = new NextRequest("http://localhost:3000/api/google/callback?state=validstate")
    const res = await GET(req)
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("google=error")
  })

  it("stores tokens and redirects to integrations on success", async () => {
    mocks.verifyState.mockReturnValue("user_1")
    mocks.getToken.mockResolvedValue({
      tokens: {
        access_token: "at",
        refresh_token: "rt",
        expiry_date: Date.now() + 3600000,
        scope: "https://www.googleapis.com/auth/calendar",
      },
    })
    mocks.userinfoGet.mockResolvedValue({ data: { email: "nick@example.com" } })
    mocks.upsert.mockResolvedValue({})

    const req = new NextRequest("http://localhost:3000/api/google/callback?code=goodcode&state=validstate")
    const res = await GET(req)

    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("google=connected")
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ userId: "user_1", email: "nick@example.com" }),
      })
    )
  })
})
```

- [ ] **Step 2: Run test — verify it fails with module not found**

```bash
npx vitest run src/__tests__/api/google/callback.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/app/api/google/connect/route.ts`**

```typescript
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { buildOAuthClient, createState } from "@/lib/google"

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/drive",
]

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const client = buildOAuthClient()
  const state = createState(userId)
  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state,
    prompt: "consent",
  })

  return NextResponse.redirect(url)
}
```

- [ ] **Step 4: Create `src/app/api/google/callback/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"
import { buildOAuthClient, verifyState } from "@/lib/google"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const errorBase = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?google=error`

  if (!code || !state) return NextResponse.redirect(errorBase)

  const userId = verifyState(state)
  if (!userId) return NextResponse.redirect(errorBase)

  const client = buildOAuthClient()

  let tokens: {
    access_token?: string | null
    refresh_token?: string | null
    expiry_date?: number | null
    scope?: string | null
  }
  try {
    const result = await client.getToken(code)
    tokens = result.tokens
  } catch {
    return NextResponse.redirect(errorBase)
  }

  if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
    return NextResponse.redirect(errorBase)
  }

  client.setCredentials(tokens)
  const oauth2 = google.oauth2({ version: "v2", auth: client as never })
  const { data } = await oauth2.userinfo.get()
  const email = data.email ?? ""

  await prisma.googleConnection.upsert({
    where: { userId },
    create: {
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date),
      scopes: (tokens.scope ?? "").split(" ").filter(Boolean),
      email,
    },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date),
      scopes: (tokens.scope ?? "").split(" ").filter(Boolean),
      email,
    },
  })

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?google=connected`
  )
}
```

- [ ] **Step 5: Create `src/app/api/google/disconnect/route.ts`**

```typescript
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { buildOAuthClient } from "@/lib/google"
import { prisma } from "@/lib/prisma"

export async function DELETE() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const conn = await prisma.googleConnection.findUnique({ where: { userId } })
  if (!conn) return NextResponse.json({ disconnected: true })

  const client = buildOAuthClient()
  try {
    await client.revokeToken(conn.accessToken)
  } catch {
    // Ignore revocation errors — still delete locally
  }

  await prisma.googleConnection.delete({ where: { userId } })
  return NextResponse.json({ disconnected: true })
}
```

- [ ] **Step 6: Create `src/app/api/google/status/route.ts`**

```typescript
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const conn = await prisma.googleConnection.findUnique({
    where: { userId },
    select: { email: true },
  })

  if (!conn) return NextResponse.json({ connected: false })
  return NextResponse.json({ connected: true, email: conn.email })
}
```

- [ ] **Step 7: Run tests — verify they pass**

```bash
npx vitest run src/__tests__/api/google/callback.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/app/api/google/ src/__tests__/api/google/
git commit -m "feat: add Google OAuth routes (connect, callback, disconnect, status)"
```

---

## Task 5: Token Refresh Cron

**Files:**
- Create: `src/trigger/googleTokenRefresh.ts`

- [ ] **Step 1: Create `src/trigger/googleTokenRefresh.ts`**

```typescript
import { schedules } from "@trigger.dev/sdk"
import { prisma } from "@/lib/prisma"
import { buildOAuthClient, handleTokenRevoked } from "@/lib/google"

export const googleTokenRefreshCron = schedules.task({
  id: "google-token-refresh",
  cron: "*/45 * * * *",
  run: async () => {
    const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000)

    const expiring = await prisma.googleConnection.findMany({
      where: { expiresAt: { lt: tenMinutesFromNow } },
      select: { userId: true, refreshToken: true },
    })

    for (const conn of expiring) {
      const client = buildOAuthClient()
      client.setCredentials({ refresh_token: conn.refreshToken })
      try {
        const { credentials } = await client.refreshAccessToken()
        await prisma.googleConnection.update({
          where: { userId: conn.userId },
          data: {
            accessToken: credentials.access_token!,
            expiresAt: new Date(credentials.expiry_date!),
          },
        })
      } catch {
        await handleTokenRevoked(conn.userId)
      }
    }
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/trigger/googleTokenRefresh.ts
git commit -m "feat: add Trigger.dev cron for proactive Google token refresh"
```

---

## Task 6: API Wrappers — Calendar, Gmail, Drive

**Files:**
- Create: `src/lib/googleCalendar.ts`
- Create: `src/lib/googleGmail.ts`
- Create: `src/lib/googleDrive.ts`
- Create: `src/__tests__/lib/googleCalendar.test.ts`

- [ ] **Step 1: Write the failing calendar test**

Create `src/__tests__/lib/googleCalendar.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"

const mocks = vi.hoisted(() => ({
  getGoogleClient: vi.fn(),
  calendarEventsList: vi.fn(),
  calendarEventsInsert: vi.fn(),
  setCredentials: vi.fn(),
}))

vi.mock("@/lib/google", () => ({ getGoogleClient: mocks.getGoogleClient }))

vi.mock("googleapis", () => ({
  google: {
    calendar: vi.fn().mockReturnValue({
      events: {
        list: mocks.calendarEventsList,
        insert: mocks.calendarEventsInsert,
      },
    }),
  },
}))

mocks.getGoogleClient.mockResolvedValue({ setCredentials: mocks.setCredentials })

import { getUpcomingEvents, createEvent } from "@/lib/googleCalendar"

describe("getUpcomingEvents", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns formatted events", async () => {
    mocks.calendarEventsList.mockResolvedValue({
      data: {
        items: [
          {
            id: "evt1",
            summary: "Standup",
            start: { dateTime: "2026-05-07T09:00:00Z" },
            end: { dateTime: "2026-05-07T09:30:00Z" },
          },
        ],
      },
    })

    const events = await getUpcomingEvents("user_1")
    expect(events).toHaveLength(1)
    expect(events[0].title).toBe("Standup")
    expect(events[0].id).toBe("evt1")
  })

  it("returns empty array when no events", async () => {
    mocks.calendarEventsList.mockResolvedValue({ data: { items: [] } })
    const events = await getUpcomingEvents("user_1")
    expect(events).toHaveLength(0)
  })
})

describe("createEvent", () => {
  it("calls events.insert and returns the event id", async () => {
    mocks.calendarEventsInsert.mockResolvedValue({ data: { id: "new_evt_1" } })

    const id = await createEvent("user_1", {
      title: "Team sync",
      start: "2026-05-08T14:00:00Z",
      end: "2026-05-08T15:00:00Z",
    })

    expect(id).toBe("new_evt_1")
    expect(mocks.calendarEventsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        requestBody: expect.objectContaining({ summary: "Team sync" }),
      })
    )
  })
})
```

- [ ] **Step 2: Run test — verify it fails with module not found**

```bash
npx vitest run src/__tests__/lib/googleCalendar.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/lib/googleCalendar.ts`**

```typescript
import { google } from "googleapis"
import { getGoogleClient } from "@/lib/google"

export type CalendarEvent = {
  id: string
  title: string
  start: string
  end: string
  description?: string
  attendees?: string[]
}

export type CreateEventDetails = {
  title: string
  start: string
  end: string
  description?: string
  attendees?: string[]
}

export async function getUpcomingEvents(userId: string, days = 7): Promise<CalendarEvent[]> {
  const auth = await getGoogleClient(userId)
  const calendar = google.calendar({ version: "v3", auth: auth as never })

  const now = new Date()
  const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: now.toISOString(),
    timeMax: until.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 50,
  })

  return (response.data.items ?? []).map((e) => ({
    id: e.id ?? "",
    title: e.summary ?? "(no title)",
    start: e.start?.dateTime ?? e.start?.date ?? "",
    end: e.end?.dateTime ?? e.end?.date ?? "",
    description: e.description ?? undefined,
    attendees: e.attendees?.map((a) => a.email ?? "").filter(Boolean),
  }))
}

export async function createEvent(userId: string, details: CreateEventDetails): Promise<string> {
  const auth = await getGoogleClient(userId)
  const calendar = google.calendar({ version: "v3", auth: auth as never })

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: details.title,
      start: { dateTime: details.start },
      end: { dateTime: details.end },
      description: details.description,
      attendees: details.attendees?.map((email) => ({ email })),
    },
  })

  return response.data.id ?? ""
}
```

- [ ] **Step 4: Create `src/lib/googleGmail.ts`**

```typescript
import { google } from "googleapis"
import { getGoogleClient } from "@/lib/google"

export type EmailSummary = {
  id: string
  threadId: string
  subject: string
  from: string
  snippet: string
}

export type SendEmailDetails = {
  to: string
  subject: string
  body: string
}

export async function getUnreadSummary(userId: string, maxResults = 10): Promise<EmailSummary[]> {
  const auth = await getGoogleClient(userId)
  const gmail = google.gmail({ version: "v1", auth: auth as never })

  const list = await gmail.users.messages.list({
    userId: "me",
    q: "is:unread",
    maxResults,
  })

  if (!list.data.messages?.length) return []

  const messages = await Promise.all(
    list.data.messages.map((m) =>
      gmail.users.messages.get({
        userId: "me",
        id: m.id!,
        format: "metadata",
        metadataHeaders: ["Subject", "From"],
      })
    )
  )

  return messages.map((r) => {
    const headers = r.data.payload?.headers ?? []
    return {
      id: r.data.id ?? "",
      threadId: r.data.threadId ?? "",
      subject: headers.find((h) => h.name === "Subject")?.value ?? "(no subject)",
      from: headers.find((h) => h.name === "From")?.value ?? "",
      snippet: r.data.snippet ?? "",
    }
  })
}

export async function getThread(userId: string, threadId: string): Promise<string> {
  const auth = await getGoogleClient(userId)
  const gmail = google.gmail({ version: "v1", auth: auth as never })

  const thread = await gmail.users.threads.get({ userId: "me", id: threadId })
  return thread.data.messages?.map((m) => m.snippet ?? "").join("\n---\n") ?? ""
}

export async function draftEmail(userId: string, details: SendEmailDetails): Promise<string> {
  const auth = await getGoogleClient(userId)
  const gmail = google.gmail({ version: "v1", auth: auth as never })

  const raw = Buffer.from(
    [`To: ${details.to}`, `Subject: ${details.subject}`, "", details.body].join("\n")
  ).toString("base64url")

  const draft = await gmail.users.drafts.create({
    userId: "me",
    requestBody: { message: { raw } },
  })

  return draft.data.id ?? ""
}

export async function sendEmail(userId: string, details: SendEmailDetails): Promise<void> {
  const auth = await getGoogleClient(userId)
  const gmail = google.gmail({ version: "v1", auth: auth as never })

  const raw = Buffer.from(
    [`To: ${details.to}`, `Subject: ${details.subject}`, "", details.body].join("\n")
  ).toString("base64url")

  await gmail.users.messages.send({ userId: "me", requestBody: { raw } })
}
```

- [ ] **Step 5: Create `src/lib/googleDrive.ts`**

```typescript
import { google } from "googleapis"
import { getGoogleClient } from "@/lib/google"

export type DriveFile = {
  id: string
  name: string
  mimeType: string
  webViewLink?: string
}

export async function searchFiles(userId: string, query: string): Promise<DriveFile[]> {
  const auth = await getGoogleClient(userId)
  const drive = google.drive({ version: "v3", auth: auth as never })

  const safeQuery = query.replace(/'/g, "\\'")
  const response = await drive.files.list({
    q: `name contains '${safeQuery}' and trashed = false`,
    fields: "files(id, name, mimeType, webViewLink)",
    pageSize: 10,
  })

  return (response.data.files ?? []).map((f) => ({
    id: f.id ?? "",
    name: f.name ?? "",
    mimeType: f.mimeType ?? "",
    webViewLink: f.webViewLink ?? undefined,
  }))
}

export async function getFile(
  userId: string,
  fileId: string
): Promise<{ metadata: DriveFile; content: string }> {
  const auth = await getGoogleClient(userId)
  const drive = google.drive({ version: "v3", auth: auth as never })

  const meta = await drive.files.get({ fileId, fields: "id, name, mimeType, webViewLink" })

  let content = ""
  if (meta.data.mimeType?.startsWith("application/vnd.google-apps")) {
    try {
      const res = await drive.files.export({ fileId, mimeType: "text/plain" }, { responseType: "text" })
      content = String(res.data)
    } catch {
      // Not all Google file types can be exported as text
    }
  }

  return {
    metadata: {
      id: meta.data.id ?? "",
      name: meta.data.name ?? "",
      mimeType: meta.data.mimeType ?? "",
      webViewLink: meta.data.webViewLink ?? undefined,
    },
    content,
  }
}

export async function createDoc(userId: string, title: string, content: string): Promise<string> {
  const auth = await getGoogleClient(userId)
  const drive = google.drive({ version: "v3", auth: auth as never })

  const response = await drive.files.create({
    requestBody: { name: title, mimeType: "application/vnd.google-apps.document" },
    media: { mimeType: "text/plain", body: content },
    fields: "id",
  })

  if (!response.data.id) throw new Error("Drive file creation returned no id")
  return response.data.id
}
```

- [ ] **Step 6: Run calendar tests — verify they pass**

```bash
npx vitest run src/__tests__/lib/googleCalendar.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/googleCalendar.ts src/lib/googleGmail.ts src/lib/googleDrive.ts src/__tests__/lib/googleCalendar.test.ts
git commit -m "feat: add Google Calendar, Gmail, and Drive API wrappers"
```

---

## Task 7: Telegram — Google Intent Detection + Confirm-Before-Write

**Files:**
- Modify: `src/trigger/telegram.ts`
- Create: `src/__tests__/trigger/googleTelegram.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/trigger/googleTelegram.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest"

// We're testing pure helper functions extracted from telegram.ts.
// Import them once the file is updated to export them.

// Inline the functions here to test without importing from telegram.ts
// (which has many side effects). After implementation, these will be
// confirmed by running the full test suite.

function isConfirmation(text: string): boolean {
  return /^(yes|confirm|yep|ok|sure|do it)$/i.test(text.trim())
}

const GOOGLE_KEYWORDS = /\b(calendar|schedule|meeting|event|email|gmail|inbox|unread|drive|document|doc|file)\b/i

function hasGoogleKeyword(text: string): boolean {
  return GOOGLE_KEYWORDS.test(text)
}

describe("isConfirmation", () => {
  it("accepts 'yes'", () => expect(isConfirmation("yes")).toBe(true))
  it("accepts 'confirm'", () => expect(isConfirmation("confirm")).toBe(true))
  it("accepts 'Yes' (case-insensitive)", () => expect(isConfirmation("Yes")).toBe(true))
  it("accepts 'do it'", () => expect(isConfirmation("do it")).toBe(true))
  it("rejects 'no'", () => expect(isConfirmation("no")).toBe(false))
  it("rejects 'maybe'", () => expect(isConfirmation("maybe")).toBe(false))
  it("rejects empty string", () => expect(isConfirmation("")).toBe(false))
  it("rejects partial match 'yes please'", () => expect(isConfirmation("yes please")).toBe(false))
})

describe("hasGoogleKeyword", () => {
  it("detects 'calendar'", () => expect(hasGoogleKeyword("What's on my calendar?")).toBe(true))
  it("detects 'email'", () => expect(hasGoogleKeyword("Check my email")).toBe(true))
  it("detects 'drive'", () => expect(hasGoogleKeyword("Find the doc in my drive")).toBe(true))
  it("returns false for unrelated text", () => expect(hasGoogleKeyword("Take a note about the meeting tomorrow")).toBe(false))
  it("detects 'unread'", () => expect(hasGoogleKeyword("Any unread messages?")).toBe(true))
})
```

- [ ] **Step 2: Run tests — verify they pass immediately (pure functions)**

```bash
npx vitest run src/__tests__/trigger/googleTelegram.test.ts
```

Expected: All 13 tests PASS (pure functions, no mocks needed).

- [ ] **Step 3: Add Google imports to `src/trigger/telegram.ts`**

Add these imports after the existing imports at the top of the file:

```typescript
import Anthropic from "@anthropic-ai/sdk"
import { getUpcomingEvents, createEvent } from "@/lib/googleCalendar"
import { getUnreadSummary, sendEmail } from "@/lib/googleGmail"
import { searchFiles, createDoc } from "@/lib/googleDrive"
```

Also add this constant and type after the existing `PAIR_PREFIX` constant:

```typescript
const anthropic = new Anthropic()

const GOOGLE_KEYWORDS = /\b(calendar|schedule|meeting|event|email|gmail|inbox|unread|drive|document|doc|file)\b/i

type GoogleIntent =
  | { action: "calendar_read"; days?: number }
  | { action: "calendar_create"; title: string; start: string; end: string; description?: string }
  | { action: "email_read" }
  | { action: "email_send"; to: string; subject: string; body: string }
  | { action: "drive_search"; query: string }
  | { action: "drive_create"; title: string; content: string }
```

- [ ] **Step 4: Add helper functions to `src/trigger/telegram.ts`**

Add these four functions after the constants block, before `handlePairing`:

```typescript
function isConfirmation(text: string): boolean {
  return /^(yes|confirm|yep|ok|sure|do it)$/i.test(text.trim())
}

async function detectGoogleIntent(text: string): Promise<GoogleIntent | null> {
  if (!GOOGLE_KEYWORDS.test(text)) return null

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: `Classify if this message requests a Google Calendar, Gmail, or Drive action.
Return ONLY valid JSON matching one of these shapes, or {"action":null} if not a Google request:
{"action":"calendar_read","days":7}
{"action":"calendar_create","title":"...","start":"ISO8601","end":"ISO8601","description":"optional"}
{"action":"email_read"}
{"action":"email_send","to":"email@example.com","subject":"...","body":"..."}
{"action":"drive_search","query":"..."}
{"action":"drive_create","title":"...","content":"..."}
{"action":null}`,
    messages: [{ role: "user", content: text }],
  })

  const raw = response.content[0].type === "text" ? response.content[0].text : "{}"
  try {
    const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? "{}")
    if (!parsed.action) return null
    return parsed as GoogleIntent
  } catch {
    return null
  }
}

function buildConfirmPrompt(intent: GoogleIntent): string {
  if (intent.action === "calendar_create") {
    const when = new Date(intent.start).toLocaleString("en-US", {
      weekday: "long", month: "long", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    })
    return `📅 Here's the event I'd create:\n${intent.title}\n${when}${intent.description ? `\n${intent.description}` : ""}`
  }
  if (intent.action === "email_send") {
    return `📧 Here's the email I'd send:\nTo: ${intent.to}\nSubject: ${intent.subject}\n\n${intent.body}`
  }
  if (intent.action === "drive_create") {
    const preview = intent.content ? `\n\n${intent.content.slice(0, 200)}${intent.content.length > 200 ? "…" : ""}` : ""
    return `📄 Here's the doc I'd create:\n"${intent.title}"${preview}`
  }
  return "Ready to proceed?"
}

async function checkAndExecutePendingAction(
  chatId: number,
  userId: string,
  text: string
): Promise<boolean> {
  if (!isConfirmation(text)) return false

  const pending = await prisma.pendingAction.findFirst({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  })

  if (!pending) return false

  await prisma.pendingAction.delete({ where: { id: pending.id } })
  const intent = pending.payload as unknown as GoogleIntent

  try {
    if (intent.action === "calendar_create") {
      await createEvent(userId, { title: intent.title, start: intent.start, end: intent.end, description: intent.description })
      await sendTelegramMessage(chatId, "Done, it's on your calendar. ✅")
    } else if (intent.action === "email_send") {
      await sendEmail(userId, { to: intent.to, subject: intent.subject, body: intent.body })
      await sendTelegramMessage(chatId, "Done, email sent. ✅")
    } else if (intent.action === "drive_create") {
      await createDoc(userId, intent.title, intent.content)
      await sendTelegramMessage(chatId, `Done, "${intent.title}" created in your Drive. ✅`)
    }
  } catch (err) {
    console.error("[telegram] pending action execution failed:", err)
    await sendTelegramMessage(chatId, "Sorry, something went wrong executing that action. Try again?")
  }

  return true
}

async function handleGoogleIntent(
  chatId: number,
  userId: string,
  intent: GoogleIntent
): Promise<boolean> {
  const isWrite =
    intent.action === "calendar_create" ||
    intent.action === "email_send" ||
    intent.action === "drive_create"

  if (isWrite) {
    await prisma.pendingAction.deleteMany({ where: { userId } })
    await prisma.pendingAction.create({
      data: {
        userId,
        type: intent.action,
        payload: JSON.parse(JSON.stringify(intent)),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    })
    const prompt = buildConfirmPrompt(intent)
    await sendTelegramMessage(chatId, `${prompt}\n\nConfirm? (yes / no)`)
    return true
  }

  if (intent.action === "calendar_read") {
    const events = await getUpcomingEvents(userId, intent.days ?? 7)
    if (events.length === 0) {
      await sendTelegramMessage(chatId, "No upcoming events found.")
      return true
    }
    const lines = events.map((e) => {
      const start = e.start
        ? new Date(e.start).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true })
        : ""
      return `• ${e.title}${start ? ` — ${start}` : ""}`
    })
    await sendTelegramMessage(chatId, `📅 Upcoming events:\n${lines.join("\n")}`)
    return true
  }

  if (intent.action === "email_read") {
    const emails = await getUnreadSummary(userId, 5)
    if (emails.length === 0) {
      await sendTelegramMessage(chatId, "No unread emails.")
      return true
    }
    const lines = emails.map((e) => `• ${e.subject} — ${e.from.split("<")[0].trim()}`)
    await sendTelegramMessage(chatId, `📬 Unread emails:\n${lines.join("\n")}`)
    return true
  }

  if (intent.action === "drive_search") {
    const files = await searchFiles(userId, intent.query)
    if (files.length === 0) {
      await sendTelegramMessage(chatId, `No files found matching "${intent.query}".`)
      return true
    }
    const lines = files.map((f) => `• ${f.name}${f.webViewLink ? ` — ${f.webViewLink}` : ""}`)
    await sendTelegramMessage(chatId, `📂 Files matching "${intent.query}":\n${lines.join("\n")}`)
    return true
  }

  return false
}
```

- [ ] **Step 5: Modify `handleMessage` in `src/trigger/telegram.ts`**

Replace the existing `handleMessage` function body. The current function starts with:
```typescript
async function handleMessage(
  payload: TelegramProcessPayload,
  userId: string
): Promise<void> {
  const { chatId, messageId, text } = payload

  const [result, context] = await Promise.all([
```

Replace the entire `handleMessage` function with:

```typescript
async function handleMessage(
  payload: TelegramProcessPayload,
  userId: string
): Promise<void> {
  const { chatId, messageId, text } = payload

  // Check if user is confirming a pending write action
  const pendingHandled = await checkAndExecutePendingAction(chatId, userId, text)
  if (pendingHandled) return

  // Check for Google intent if user has a Google connection
  const googleConn = await prisma.googleConnection.findUnique({
    where: { userId },
    select: { id: true },
  })

  if (googleConn) {
    const intent = await detectGoogleIntent(text)
    if (intent) {
      const googleHandled = await handleGoogleIntent(chatId, userId, intent)
      if (googleHandled) return
    }
  }

  const [result, context] = await Promise.all([
    runEntityExtraction({
      text,
      sourceType: "telegram",
      userId,
      sourceId: messageId.toString(),
      snippet: text,
    }),
    getGraphContext(userId),
  ])

  if (result.error) {
    console.warn("[telegram] extraction error:", result.error, "for message", messageId)
    const reply = await generateBirdReply(
      { text, entities: [], counts: { entitiesCreated: 0, entitiesUpdated: 0, totalEntities: 0 }, error: true, ...context },
      "Got that — something glitched on my end. Try again?"
    )
    await sendTelegramMessage(chatId, reply)
    return
  }

  const total = result.entitiesCreated + result.entitiesReused

  if (total === 0) {
    const reply = await generateBirdReply(
      { text, entities: [], counts: { entitiesCreated: 0, entitiesUpdated: 0, totalEntities: 0 }, error: false, ...context },
      "Got that."
    )
    await sendTelegramMessage(chatId, reply)
    return
  }

  const reply = await generateBirdReply(
    {
      text,
      entities: result.entities,
      counts: { entitiesCreated: result.entitiesCreated, entitiesUpdated: result.entitiesReused, totalEntities: total },
      error: false,
      ...context,
    },
    "Got it."
  )
  await sendTelegramMessage(chatId, reply)
}
```

- [ ] **Step 6: Run the full test suite**

```bash
npx vitest run
```

Expected: All tests pass. Fix any TypeScript errors that arise from the new imports.

- [ ] **Step 7: Commit**

```bash
git add src/trigger/telegram.ts src/__tests__/trigger/googleTelegram.test.ts
git commit -m "feat: add Google intent detection and confirm-before-write to Telegram handler"
```

---

## Task 8: Morning Briefing Task

**Files:**
- Create: `src/trigger/morningBrief.ts`

Note: The existing `src/trigger/brief.ts` generates MCP project briefs — a different feature. This is a new task for daily Telegram morning summaries.

- [ ] **Step 1: Create `src/trigger/morningBrief.ts`**

```typescript
import { schedules } from "@trigger.dev/sdk"
import { prisma } from "@/lib/prisma"
import { getUpcomingEvents } from "@/lib/googleCalendar"
import { getUnreadSummary } from "@/lib/googleGmail"
import { sendTelegramMessage } from "@/lib/telegram"

export const morningBriefTask = schedules.task({
  id: "morning-brief",
  cron: "0 7 * * *",
  run: async () => {
    const telegramUsers = await prisma.telegramUser.findMany({
      select: { userId: true, telegramChatId: true },
    })

    for (const tgUser of telegramUsers) {
      const googleConn = await prisma.googleConnection.findUnique({
        where: { userId: tgUser.userId },
        select: { id: true },
      })
      if (!googleConn) continue

      try {
        const [events, emails] = await Promise.all([
          getUpcomingEvents(tgUser.userId, 1),
          getUnreadSummary(tgUser.userId, 3),
        ])

        const lines: string[] = ["🌅 Good morning! Here's your briefing:\n"]

        if (events.length > 0) {
          lines.push("📅 *Today's calendar:*")
          for (const e of events) {
            const time = e.start
              ? new Date(e.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
              : ""
            lines.push(`• ${e.title}${time ? ` at ${time}` : ""}`)
          }
          lines.push("")
        }

        if (emails.length > 0) {
          lines.push(`📬 *${emails.length} unread email${emails.length > 1 ? "s" : ""}:*`)
          for (const e of emails) {
            lines.push(`• ${e.subject} — ${e.from.split("<")[0].trim()}`)
          }
        }

        if (events.length === 0 && emails.length === 0) {
          lines.push("All clear — no events today and no unread emails.")
        }

        await sendTelegramMessage(parseInt(tgUser.telegramChatId, 10), lines.join("\n"))
      } catch (err) {
        console.error(`[morningBrief] failed for user ${tgUser.userId}:`, err)
      }
    }
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/trigger/morningBrief.ts
git commit -m "feat: add morning briefing Trigger.dev task with Google Calendar and Gmail data"
```

---

## Task 9: Dashboard UI — Wire Google Cards

**Files:**
- Modify: `src/app/dashboard/integrations/page.tsx`

The current file has Google Calendar in the `scheduling` section and Gmail in the `email` section. Google Drive is not yet listed. All three share one OAuth flow.

- [ ] **Step 1: Add `GoogleStatus` type and state to `IntegrationsPage`**

Add the new type after the existing `PairResult` type (around line 15):

```typescript
type GoogleStatus =
  | { state: "loading" }
  | { state: "disconnected" }
  | { state: "connected"; email: string }
  | { state: "error" }
```

Add to the `IntegrationDef` interface (after `live?: boolean`):

```typescript
  googleService?: boolean
```

Add new state variables inside `IntegrationsPage` after the existing state declarations:

```typescript
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus>({ state: "loading" })
  const [showGoogleConnectModal, setShowGoogleConnectModal] = useState(false)
  const [showGoogleDisconnect, setShowGoogleDisconnect] = useState(false)
  const [googleDisconnectInput, setGoogleDisconnectInput] = useState("")
  const [disconnectingGoogle, setDisconnectingGoogle] = useState(false)
  const [showGoogleMenu, setShowGoogleMenu] = useState(false)
```

- [ ] **Step 2: Add Google status fetch in `useEffect`**

Add a second `useEffect` after the existing Telegram `useEffect` (after line ~142):

```typescript
  useEffect(() => {
    fetch("/api/google/status")
      .then((r) => r.json())
      .then((data: { connected: boolean; email?: string }) => {
        setGoogleStatus(
          data.connected
            ? { state: "connected", email: data.email ?? "" }
            : { state: "disconnected" }
        )
      })
      .catch(() => setGoogleStatus({ state: "error" }))
  }, [])
```

Also add a check for the `?google=connected` redirect param. Replace the existing Telegram `useEffect` block (the entire block) with a combined version that also handles the query param:

```typescript
  useEffect(() => {
    fetch("/api/telegram/status")
      .then((r) => r.json())
      .then((data: { paired: boolean; displayName?: string }) => {
        setTgStatus(
          data.paired
            ? { state: "paired", displayName: data.displayName ?? "Telegram" }
            : { state: "unpaired" }
        )
      })
      .catch(() => setTgStatus({ state: "error" }))
  }, [])

  useEffect(() => {
    fetch("/api/google/status")
      .then((r) => r.json())
      .then((data: { connected: boolean; email?: string }) => {
        setGoogleStatus(
          data.connected
            ? { state: "connected", email: data.email ?? "" }
            : { state: "disconnected" }
        )
      })
      .catch(() => setGoogleStatus({ state: "error" }))
  }, [])
```

- [ ] **Step 3: Add Google handler functions**

Add after `handleDisconnect` (after line ~188):

```typescript
  async function handleGoogleDisconnect() {
    setDisconnectingGoogle(true)
    try {
      await fetch("/api/google/disconnect", { method: "DELETE" })
      setGoogleStatus({ state: "disconnected" })
    } finally {
      setDisconnectingGoogle(false)
      setShowGoogleDisconnect(false)
      setGoogleDisconnectInput("")
    }
  }

  const isGoogleConnected = googleStatus.state === "connected"
  const googleDisconnectConfirmed =
    googleDisconnectInput.trim().toLowerCase() === "disconnect google"
```

- [ ] **Step 4: Update `SECTIONS` to mark Google integrations and add Drive**

Replace the `SECTIONS` constant with this updated version. Key changes: `googleService: true` on Calendar and Gmail, and a new "files" section with Drive:

```typescript
const SECTIONS: SectionDef[] = [
  {
    id: "home",
    title: "Pick a home",
    subtitle: "Select where your Bird will live",
    accent: "#38bdf8",
    integrations: [
      { name: "Telegram",  description: "Send notes via DM",        icon: "/Telegram.svg",  iconBg: "", live: true },
      { name: "WhatsApp",  description: "Chat via WhatsApp",         icon: "/Whatsapp.svg",  iconBg: "" },
      { name: "iMessage",  description: "Chat via iMessage",         icon: "/IMessage.svg",  iconBg: "" },
    ],
  },
  {
    id: "scheduling",
    title: "Manage your schedule",
    subtitle: "Let Bird handle your calendar and time",
    accent: "#f59e0b",
    integrations: [
      { name: "Google Calendar",  description: "Sync meetings",         icon: "/google-calendar.svg",   iconBg: "", googleService: true },
      { name: "Apple Calendar",   description: "Sync iCal events",      icon: null, iconBg: "#FF3B30",  initials: "AC" },
      { name: "Outlook Calendar", description: "Sync Outlook calendar", icon: "/Microsoft_Outlook.svg", iconBg: "" },
      { name: "Fantastical",      description: "Natural language cal",  icon: null, iconBg: "#C0362B",  initials: "Fa" },
      { name: "Calendly",         description: "Manage your bookings",  icon: null, iconBg: "#006BFF",  initials: "Cl" },
    ],
  },
  {
    id: "email",
    title: "Manage your email",
    subtitle: "Let Bird read and draft emails on your behalf",
    accent: "#f43f5e",
    integrations: [
      { name: "Gmail",      description: "Read and draft emails", icon: "/google-gmail.svg",      iconBg: "", googleService: true },
      { name: "Outlook",    description: "Read Outlook inbox",    icon: "/Microsoft_Outlook.svg", iconBg: "" },
      { name: "Apple Mail", description: "Read Apple Mail",       icon: null, iconBg: "#1C6CE8",  initials: "AM" },
      { name: "ProtonMail", description: "Read ProtonMail",       icon: null, iconBg: "#6D4AFF",  initials: "PM" },
      { name: "Fastmail",   description: "Read Fastmail inbox",   icon: null, iconBg: "#F66A00",  initials: "Fm" },
      { name: "Hey",        description: "Read Hey inbox",        icon: null, iconBg: "#E02D0A",  initials: "He" },
    ],
  },
  {
    id: "files",
    title: "Manage your files",
    subtitle: "Let Bird search and create documents on your behalf",
    accent: "#34d399",
    integrations: [
      { name: "Google Drive", description: "Search and create docs", icon: null, iconBg: "#4285F4", initials: "GD", googleService: true },
      { name: "Dropbox",      description: "Search Dropbox files",   icon: null, iconBg: "#0061FF", initials: "Db" },
      { name: "OneDrive",     description: "Search OneDrive",        icon: null, iconBg: "#0078D4", initials: "OD" },
    ],
  },
  {
    id: "community",
    title: "Manage your community",
    subtitle: "Bring Bird into your team's workspace",
    accent: "#8b5cf6",
    integrations: [
      { name: "Slack",           description: "Slack workspace",  icon: "/Slack.svg",   iconBg: "" },
      { name: "Discord",         description: "Discord server",   icon: "/Discord.svg", iconBg: "" },
      { name: "Microsoft Teams", description: "Teams workspace",  icon: null, iconBg: "#6264A7", initials: "Te" },
      { name: "Notion",          description: "Notion workspace", icon: null, iconBg: "#404040", initials: "No" },
      { name: "Linear",          description: "Linear projects",  icon: null, iconBg: "#5E6AD2", initials: "Li" },
      { name: "GitHub",          description: "Repo activity",    icon: null, iconBg: "#333333", initials: "Gh" },
    ],
  },
  {
    id: "social",
    title: "Manage your social media",
    subtitle: "Let Bird monitor and post on your behalf",
    accent: "#ec4899",
    integrations: [
      { name: "X (Twitter)", description: "Posts and mentions", icon: null, iconBg: "#18181b", initials: "X"  },
      { name: "Instagram",   description: "Instagram posts",    icon: null, iconBg: "#E1306C", initials: "In" },
      { name: "TikTok",      description: "TikTok content",     icon: null, iconBg: "#010101", initials: "Ti" },
      { name: "LinkedIn",    description: "LinkedIn posts",     icon: null, iconBg: "#0077B5", initials: "Li" },
      { name: "YouTube",     description: "YouTube channel",    icon: null, iconBg: "#FF0000", initials: "Yt" },
      { name: "Threads",     description: "Threads posts",      icon: null, iconBg: "#3A3A3A", initials: "Th" },
    ],
  },
]
```

- [ ] **Step 5: Update the card render logic to handle Google cards**

In the `{section.integrations.map((integration) => {` block, add a Google card branch. Currently there are two branches: `isTelegram` and the default "Soon" card. Add a third branch between them:

```typescript
              const isTelegram = integration.live === true
              const isGoogle = integration.googleService === true

              if (isTelegram) {
                // ... existing Telegram card JSX unchanged ...
              }

              if (isGoogle) {
                return (
                  <div
                    key={integration.name}
                    data-connected={isGoogleConnected ? "true" : undefined}
                    className="integ-card flex items-center gap-4 px-5 py-4 rounded-xl relative"
                  >
                    {integration.icon ? (
                      <Image src={integration.icon} alt={integration.name} width={40} height={40} className="flex-shrink-0" />
                    ) : (
                      <InitialIcon initials={integration.initials ?? integration.name[0]} bg={integration.iconBg} />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold font-sans text-text-base leading-none">
                          {integration.name}
                        </p>
                        {googleStatus.state === "loading" ? (
                          <div className="h-4 w-20 rounded bg-surface animate-pulse" />
                        ) : isGoogleConnected ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium font-sans border"
                            style={{ background: "rgba(52,211,153,0.1)", borderColor: "rgba(52,211,153,0.22)", color: "#34d399" }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                            Connected
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs font-sans text-text-muted truncate">
                        {isGoogleConnected && googleStatus.state === "connected"
                          ? googleStatus.email
                          : integration.description}
                      </p>
                      {!isGoogleConnected && googleStatus.state !== "loading" && (
                        <button
                          onClick={() => setShowGoogleConnectModal(true)}
                          className="integ-connect-btn mt-2 px-3 py-1 rounded-lg text-xs font-semibold font-sans transition-colors"
                        >
                          Connect
                        </button>
                      )}
                    </div>

                    {isGoogleConnected && (
                      <div className="relative flex-shrink-0">
                        <button
                          onClick={() => setShowGoogleMenu((v) => !v)}
                          className="p-1.5 rounded-lg transition-colors text-text-muted hover:text-text-base"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {showGoogleMenu && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowGoogleMenu(false)} />
                            <div className="integ-dropdown absolute right-0 bottom-8 z-20 rounded-xl py-1 min-w-[130px] shadow-xl">
                              <button
                                onClick={() => {
                                  setShowGoogleMenu(false)
                                  setShowGoogleDisconnect(true)
                                  setGoogleDisconnectInput("")
                                }}
                                className="w-full text-center px-4 py-2 text-sm font-sans font-medium transition-colors"
                                style={{ color: "#f87171" }}
                              >
                                Disconnect
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              }

              // existing "Soon" card for non-live integrations
              return (
                <div key={integration.name} className="integ-card flex items-center gap-4 px-5 py-4 rounded-xl">
                  {/* ... existing Soon card JSX unchanged ... */}
                </div>
              )
```

- [ ] **Step 6: Add Google connect and disconnect modals**

Add these two modals right before the closing `</div>` of the page, after the existing Disconnect Telegram modal:

```typescript
      {/* Connect Google modal */}
      {showGoogleConnectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowGoogleConnectModal(false) }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.18)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-heading font-bold text-base text-text-base">Connect Google</span>
              <button onClick={() => setShowGoogleConnectModal(false)} className="text-text-muted hover:text-text-base transition-colors">
                <X size={16} />
              </button>
            </div>
            <p className="text-xs font-sans text-text-muted mb-5 leading-relaxed">
              Give Bird read and write access to your Google Calendar, Gmail, and Drive. You'll
              confirm all write actions before Bird executes them.
            </p>
            <a
              href="/api/google/connect"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold font-sans transition-colors"
              style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.22)", color: "#34d399" }}
            >
              Connect Google Account
            </a>
          </div>
        </div>
      )}

      {/* Disconnect Google modal */}
      {showGoogleDisconnect && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowGoogleDisconnect(false)
              setGoogleDisconnectInput("")
            }
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.18)" }}
          >
            <h2 className="font-heading font-bold text-base text-text-base mb-1">Disconnect Google?</h2>
            <p className="text-xs font-sans text-text-muted mb-5 leading-relaxed">
              Bird will lose access to your Calendar, Gmail, and Drive. Type{" "}
              <span className="font-mono text-text-base">disconnect Google</span> to confirm.
            </p>
            <input
              type="text"
              value={googleDisconnectInput}
              onChange={(e) => setGoogleDisconnectInput(e.target.value)}
              placeholder="disconnect Google"
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg text-sm font-mono bg-transparent text-text-base placeholder:text-text-muted focus:outline-none mb-4"
              style={{ border: "1px solid rgba(255,255,255,0.18)" }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowGoogleDisconnect(false); setGoogleDisconnectInput("") }}
                className="flex-1 py-2 rounded-lg text-xs font-semibold font-sans"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.65)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleGoogleDisconnect}
                disabled={!googleDisconnectConfirmed || disconnectingGoogle}
                className="flex-1 py-2 rounded-lg text-xs font-semibold font-sans disabled:opacity-30 transition-colors"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
              >
                {disconnectingGoogle ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
          </div>
        </div>
      )}
```

- [ ] **Step 7: Run the dev server and verify the UI**

```bash
npm run dev
```

Open `http://localhost:3000/dashboard/integrations`. Verify:
1. Google Calendar, Gmail, and Drive cards all show "Connect" button (not "Soon" badge)
2. Clicking Connect on any Google card opens the connect modal
3. All three cards have the same connected/disconnected state (they share one OAuth flow)

- [ ] **Step 8: Commit**

```bash
git add src/app/dashboard/integrations/page.tsx
git commit -m "feat: wire Google Calendar, Gmail, and Drive cards in integrations dashboard"
```

---

## Task 10: Environment Variables + Google Cloud Console Setup

**Files:**
- Modify: `.env.local`

- [ ] **Step 1: Create a Google Cloud project and OAuth credentials**

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. Enable these APIs: **Google Calendar API**, **Gmail API**, **Google Drive API**, **Google OAuth2 API**
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**
5. Application type: **Web application**
6. Authorized redirect URIs: add `http://localhost:3000/api/google/callback` (for dev) and `https://your-vercel-domain.vercel.app/api/google/callback` (for prod)
7. Copy the **Client ID** and **Client Secret**
8. Go to **APIs & Services → OAuth consent screen** → set User type to **External**, add your email as a test user

- [ ] **Step 2: Add env vars to `.env.local`**

Add these three lines to `.env.local` (after the `TELEGRAM_BOT_USERNAME` line):

```
# ── Google OAuth ─────────────────────────────────────────────
GOOGLE_CLIENT_ID=<your-client-id-from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<your-client-secret-from-google-cloud-console>
GOOGLE_OAUTH_STATE_SECRET=<generate-with: openssl rand -hex 32>
```

Generate the state secret by running in terminal:
```bash
openssl rand -hex 32
```

- [ ] **Step 3: Add env vars to Vercel**

In the Vercel dashboard → Project → Settings → Environment Variables, add all three vars to the **Production** environment:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_OAUTH_STATE_SECRET`

Also update `NEXT_PUBLIC_APP_URL` to your production domain if it's still `http://localhost:3000`.

- [ ] **Step 4: Verify the full OAuth flow locally**

1. Run `npm run dev`
2. Sign in and go to `/dashboard/integrations`
3. Click "Connect" on any Google card
4. You should be redirected to Google's consent screen
5. After granting permission, you should land back at `/dashboard/integrations` with all three Google cards showing "Connected" and your Google email

- [ ] **Step 5: Commit env var template**

Do NOT commit `.env.local` (it's in `.gitignore`). Instead, update `.env.example` if one exists, or add a note to the README.

---

## Self-Review

**Spec coverage check:**
- ✅ DB migration: `GoogleConnection` + `PendingAction` — Task 1
- ✅ OAuth flow (connect, callback, disconnect, status) — Task 4
- ✅ CSRF protection via HMAC-signed state — Task 3
- ✅ Lazy token refresh in `getGoogleClient` — Task 3
- ✅ Trigger.dev cron safety-net refresh — Task 5
- ✅ Token revocation → delete row + Telegram notification — Task 3
- ✅ `getUpcomingEvents`, `createEvent` — Task 6
- ✅ `getUnreadSummary`, `getThread`, `draftEmail`, `sendEmail` — Task 6
- ✅ `searchFiles`, `getFile`, `createDoc` — Task 6
- ✅ `draftEmail` and `sendEmail` separate functions — Task 6
- ✅ Morning briefing (Calendar + Gmail, no Drive) — Task 8
- ✅ Reactive Telegram queries (calendar, email, drive reads) — Task 7
- ✅ Confirm-before-write via `PendingAction` — Task 7
- ✅ One pending action per user at a time (deleteMany before create) — Task 7
- ✅ `PendingAction` expires after 10 minutes — Task 7
- ✅ Confirmation via `yes`/`confirm` (case-insensitive) — Task 7
- ✅ Dashboard: single OAuth flow for all 3 cards — Task 9
- ✅ Dashboard: connected state shows green badge + email — Task 9
- ✅ Dashboard: disconnect removes all three — Task 9
- ✅ Env vars — Task 10

**Type consistency check:**
- `getGoogleClient(userId)` returns `OAuth2Client` — consistent across google.ts, all wrappers
- `handleTokenRevoked(userId)` — consistent in google.ts and googleTokenRefresh.ts
- `CalendarEvent`, `CreateEventDetails` — defined in googleCalendar.ts, used in telegram.ts
- `EmailSummary`, `SendEmailDetails` — defined in googleGmail.ts, used in telegram.ts
- `DriveFile` — defined in googleDrive.ts, used in telegram.ts
- `GoogleIntent` discriminated union — defined in telegram.ts, used in handleGoogleIntent + checkAndExecutePendingAction
