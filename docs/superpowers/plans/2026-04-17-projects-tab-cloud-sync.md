# Projects Tab + Cloud Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sync local birdbot-mcp decisions/sessions to Neon and display them in the dashboard Projects tab as a three-level drill-down: Projects → Sessions → Session detail with decisions.

**Architecture:** Two repos change. birdbot-cloud gets two Prisma models, five API routes, and three updated/new dashboard pages. birdbot-mcp gets session_id tracking in SQLite and fire-and-forget cloud sync calls. Token auth (Authorization: Bearer) guards the sync routes; Clerk auth guards the dashboard read routes.

**Tech Stack:** Next.js App Router, Prisma 6 (prisma-client generator), Neon Postgres, @clerk/nextjs/server, vitest, better-sqlite3, @modelcontextprotocol/sdk

---

## File Map

### birdbot-cloud (`/Users/nicolasbreen/Projects/Birdbot.ai/birdbot-cloud`)

| Action | File |
|--------|------|
| Modify | `prisma/schema.prisma` |
| Create | `src/app/api/mcp/sessions/route.ts` |
| Create | `src/app/api/mcp/decisions/route.ts` |
| Create | `src/app/api/projects/route.ts` |
| Create | `src/app/api/projects/[project]/sessions/route.ts` |
| Create | `src/app/api/projects/[project]/sessions/[sessionId]/route.ts` |
| Modify | `src/app/dashboard/projects/page.tsx` |
| Create | `src/app/dashboard/projects/[project]/page.tsx` |
| Create | `src/app/dashboard/projects/[project]/sessions/[sessionId]/page.tsx` |
| Create | `src/__tests__/api/mcp-sessions.test.ts` |
| Create | `src/__tests__/api/mcp-decisions.test.ts` |
| Create | `src/__tests__/api/projects.test.ts` |
| Create | `src/__tests__/api/projects-sessions.test.ts` |
| Create | `src/__tests__/api/projects-session-detail.test.ts` |

### birdbot-mcp (`/Users/nicolasbreen/Projects/birdbot-mcp`)

| Action | File |
|--------|------|
| Modify | `src/db.ts` |
| Modify | `src/index.ts` |
| Modify | `package.json` |

---

## Task 1: Prisma schema — add CloudSession and CloudDecision

**Files:**
- Modify: `prisma/schema.prisma`
- Working directory: `/Users/nicolasbreen/Projects/Birdbot.ai/birdbot-cloud`

- [ ] **Step 1: Append two models to `prisma/schema.prisma`**

Add after the McpConnection model:

```prisma
model CloudSession {
  id        String   @id @default(cuid())
  userToken String
  project   String
  sessionId String   @unique
  summary   String?
  createdAt DateTime
  syncedAt  DateTime @default(now())

  @@index([userToken, project])
}

model CloudDecision {
  id        String   @id @default(cuid())
  userToken String
  project   String
  sessionId String?
  decision  String
  reasoning String?
  createdAt DateTime
  syncedAt  DateTime @default(now())

  @@index([userToken, project])
  @@index([sessionId])
}
```

- [ ] **Step 2: Create and apply the migration**

```bash
npx prisma migrate dev --name add_cloud_session_decision
```

Expected: Migration created and applied. Prisma client regenerated.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add CloudSession and CloudDecision prisma models"
```

---

## Task 2: POST /api/mcp/sessions

**Files:**
- Create: `src/__tests__/api/mcp-sessions.test.ts`
- Create: `src/app/api/mcp/sessions/route.ts`
- Working directory: `/Users/nicolasbreen/Projects/Birdbot.ai/birdbot-cloud`

**Context:** Auth — read `Authorization: Bearer <token>` header, look up `McpConnection.userToken`, return 401 if not found. Upsert on `sessionId` (idempotent). See `src/app/api/mcp/ping/route.ts` and `src/__tests__/api/mcp-ping.test.ts` for the existing pattern.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/api/mcp-sessions.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

const mockFindUnique = vi.fn()
const mockUpsert = vi.fn()
vi.mock("@/lib/prisma", () => ({
  prisma: {
    mcpConnection: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    cloudSession: {
      upsert: (...args: unknown[]) => mockUpsert(...args),
    },
  },
}))

const validBody = {
  project: "birdbot-cloud",
  sessionId: "test-session-uuid",
  summary: "Built connection detection",
  createdAt: "2026-04-17T10:00:00.000Z",
}

function makeRequest(body: unknown, token?: string) {
  return new Request("http://localhost/api/mcp/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
}

describe("POST /api/mcp/sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpsert.mockResolvedValue({})
  })

  it("returns 401 when no Authorization header", async () => {
    const { POST } = await import("@/app/api/mcp/sessions/route")
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(401)
  })

  it("returns 401 when token not found in DB", async () => {
    mockFindUnique.mockResolvedValueOnce(null)
    const { POST } = await import("@/app/api/mcp/sessions/route")
    const res = await POST(makeRequest(validBody, "unknown-token"))
    expect(res.status).toBe(401)
  })

  it("returns 400 when sessionId is missing", async () => {
    mockFindUnique.mockResolvedValueOnce({ userToken: "valid-token" })
    const { POST } = await import("@/app/api/mcp/sessions/route")
    const { sessionId: _, ...noSessionId } = validBody
    const res = await POST(makeRequest(noSessionId, "valid-token"))
    expect(res.status).toBe(400)
  })

  it("upserts CloudSession and returns ok:true", async () => {
    mockFindUnique.mockResolvedValueOnce({ userToken: "valid-token" })
    const { POST } = await import("@/app/api/mcp/sessions/route")
    const res = await POST(makeRequest(validBody, "valid-token"))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body).toMatchObject({ ok: true })
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { sessionId: "test-session-uuid" },
        create: expect.objectContaining({
          userToken: "valid-token",
          project: "birdbot-cloud",
          sessionId: "test-session-uuid",
          summary: "Built connection detection",
        }),
      })
    )
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/__tests__/api/mcp-sessions.test.ts
```

Expected: FAIL — "Cannot find module '@/app/api/mcp/sessions/route'"

- [ ] **Step 3: Implement the route**

Create `src/app/api/mcp/sessions/route.ts`:

```ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const connection = await prisma.mcpConnection.findUnique({
      where: { userToken: token },
    })

    if (!connection) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json() as {
      project?: string
      sessionId?: string
      summary?: string
      createdAt?: string
    }

    if (!body.sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 })
    }

    await prisma.cloudSession.upsert({
      where: { sessionId: body.sessionId },
      create: {
        userToken: token,
        project: body.project ?? "default",
        sessionId: body.sessionId,
        summary: body.summary ?? null,
        createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
      },
      update: {
        summary: body.summary ?? null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[/api/mcp/sessions] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/api/mcp-sessions.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/mcp/sessions/route.ts src/__tests__/api/mcp-sessions.test.ts
git commit -m "feat: add POST /api/mcp/sessions sync endpoint"
```

---

## Task 3: POST /api/mcp/decisions

**Files:**
- Create: `src/__tests__/api/mcp-decisions.test.ts`
- Create: `src/app/api/mcp/decisions/route.ts`
- Working directory: `/Users/nicolasbreen/Projects/Birdbot.ai/birdbot-cloud`

**Context:** Same Bearer token auth as Task 2. Creates a CloudDecision row. `sessionId` is optional in the body.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/api/mcp-decisions.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

const mockFindUnique = vi.fn()
const mockCreate = vi.fn()
vi.mock("@/lib/prisma", () => ({
  prisma: {
    mcpConnection: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    cloudDecision: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}))

const validBody = {
  project: "birdbot-cloud",
  sessionId: "test-session-uuid",
  decision: "Use fire-and-forget fetch for MCP ping",
  reasoning: "Briefing must always return.",
  createdAt: "2026-04-17T10:05:00.000Z",
}

function makeRequest(body: unknown, token?: string) {
  return new Request("http://localhost/api/mcp/decisions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
}

describe("POST /api/mcp/decisions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreate.mockResolvedValue({})
  })

  it("returns 401 when no Authorization header", async () => {
    const { POST } = await import("@/app/api/mcp/decisions/route")
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(401)
  })

  it("returns 401 when token not found in DB", async () => {
    mockFindUnique.mockResolvedValueOnce(null)
    const { POST } = await import("@/app/api/mcp/decisions/route")
    const res = await POST(makeRequest(validBody, "unknown-token"))
    expect(res.status).toBe(401)
  })

  it("returns 400 when decision text is missing", async () => {
    mockFindUnique.mockResolvedValueOnce({ userToken: "valid-token" })
    const { POST } = await import("@/app/api/mcp/decisions/route")
    const { decision: _, ...noDecision } = validBody
    const res = await POST(makeRequest(noDecision, "valid-token"))
    expect(res.status).toBe(400)
  })

  it("creates CloudDecision and returns ok:true", async () => {
    mockFindUnique.mockResolvedValueOnce({ userToken: "valid-token" })
    const { POST } = await import("@/app/api/mcp/decisions/route")
    const res = await POST(makeRequest(validBody, "valid-token"))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body).toMatchObject({ ok: true })
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userToken: "valid-token",
          project: "birdbot-cloud",
          sessionId: "test-session-uuid",
          decision: "Use fire-and-forget fetch for MCP ping",
        }),
      })
    )
  })

  it("creates CloudDecision with null sessionId when omitted", async () => {
    mockFindUnique.mockResolvedValueOnce({ userToken: "valid-token" })
    const { POST } = await import("@/app/api/mcp/decisions/route")
    const { sessionId: _, ...noSessionId } = validBody
    const res = await POST(makeRequest(noSessionId, "valid-token"))
    expect(res.status).toBe(200)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ sessionId: null }),
      })
    )
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/__tests__/api/mcp-decisions.test.ts
```

Expected: FAIL — "Cannot find module '@/app/api/mcp/decisions/route'"

- [ ] **Step 3: Implement the route**

Create `src/app/api/mcp/decisions/route.ts`:

```ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const connection = await prisma.mcpConnection.findUnique({
      where: { userToken: token },
    })

    if (!connection) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json() as {
      project?: string
      sessionId?: string
      decision?: string
      reasoning?: string
      createdAt?: string
    }

    if (!body.decision) {
      return NextResponse.json({ error: "decision required" }, { status: 400 })
    }

    await prisma.cloudDecision.create({
      data: {
        userToken: token,
        project: body.project ?? "default",
        sessionId: body.sessionId ?? null,
        decision: body.decision,
        reasoning: body.reasoning ?? null,
        createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[/api/mcp/decisions] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/api/mcp-decisions.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/mcp/decisions/route.ts src/__tests__/api/mcp-decisions.test.ts
git commit -m "feat: add POST /api/mcp/decisions sync endpoint"
```

---

## Task 4: GET /api/projects

**Files:**
- Create: `src/__tests__/api/projects.test.ts`
- Create: `src/app/api/projects/route.ts`
- Working directory: `/Users/nicolasbreen/Projects/Birdbot.ai/birdbot-cloud`

**Context:** Clerk auth — same pattern as `src/app/api/connection/status/route.ts`. Look up McpConnection by clerkUserId to get the userToken. If no McpConnection, return `{ projects: [] }` (not 404). Use `groupBy` to aggregate session counts and decision counts per project.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/api/projects.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "user_123" }),
}))

const mockMcpFindUnique = vi.fn()
const mockSessionGroupBy = vi.fn()
const mockDecisionGroupBy = vi.fn()
vi.mock("@/lib/prisma", () => ({
  prisma: {
    mcpConnection: {
      findUnique: (...args: unknown[]) => mockMcpFindUnique(...args),
    },
    cloudSession: {
      groupBy: (...args: unknown[]) => mockSessionGroupBy(...args),
    },
    cloudDecision: {
      groupBy: (...args: unknown[]) => mockDecisionGroupBy(...args),
    },
  },
}))

describe("GET /api/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server")
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)
    const { GET } = await import("@/app/api/projects/route")
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("returns empty projects when no McpConnection exists", async () => {
    mockMcpFindUnique.mockResolvedValueOnce(null)
    const { GET } = await import("@/app/api/projects/route")
    const res = await GET()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.projects).toEqual([])
  })

  it("returns aggregated project list with counts", async () => {
    mockMcpFindUnique.mockResolvedValueOnce({ userToken: "valid-token" })
    mockSessionGroupBy.mockResolvedValueOnce([
      { project: "birdbot-cloud", _count: { id: 12 }, _max: { createdAt: new Date("2026-04-17") } },
    ])
    mockDecisionGroupBy.mockResolvedValueOnce([
      { project: "birdbot-cloud", _count: { id: 8 } },
    ])
    const { GET } = await import("@/app/api/projects/route")
    const res = await GET()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.projects).toHaveLength(1)
    expect(body.projects[0]).toMatchObject({
      name: "birdbot-cloud",
      sessionCount: 12,
      decisionCount: 8,
    })
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/__tests__/api/projects.test.ts
```

Expected: FAIL — "Cannot find module '@/app/api/projects/route'"

- [ ] **Step 3: Implement the route**

Create `src/app/api/projects/route.ts`:

```ts
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const connection = await prisma.mcpConnection.findUnique({
      where: { clerkUserId: userId },
    })

    if (!connection) {
      return NextResponse.json({ projects: [] })
    }

    const { userToken } = connection

    const [sessionGroups, decisionGroups] = await Promise.all([
      prisma.cloudSession.groupBy({
        by: ["project"],
        where: { userToken },
        _count: { id: true },
        _max: { createdAt: true },
        orderBy: { _max: { createdAt: "desc" } },
      }),
      prisma.cloudDecision.groupBy({
        by: ["project"],
        where: { userToken },
        _count: { id: true },
      }),
    ])

    const decisionMap = Object.fromEntries(
      decisionGroups.map((g) => [g.project, g._count.id])
    )

    const projects = sessionGroups.map((g) => ({
      name: g.project,
      sessionCount: g._count.id,
      decisionCount: decisionMap[g.project] ?? 0,
      lastSessionAt: g._max.createdAt,
    }))

    return NextResponse.json({ projects })
  } catch (err) {
    console.error("[/api/projects] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/api/projects.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/projects/route.ts src/__tests__/api/projects.test.ts
git commit -m "feat: add GET /api/projects dashboard endpoint"
```

---

## Task 5: GET /api/projects/[project]/sessions

**Files:**
- Create: `src/__tests__/api/projects-sessions.test.ts`
- Create: `src/app/api/projects/[project]/sessions/route.ts`
- Working directory: `/Users/nicolasbreen/Projects/Birdbot.ai/birdbot-cloud`

**Context:** Clerk auth. In Next.js 15 App Router, dynamic route handler params are a `Promise` — use `await params` before destructuring. Returns sessions newest-first with per-session decision counts.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/api/projects-sessions.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "user_123" }),
}))

const mockMcpFindUnique = vi.fn()
const mockSessionFindMany = vi.fn()
const mockDecisionGroupBy = vi.fn()
vi.mock("@/lib/prisma", () => ({
  prisma: {
    mcpConnection: {
      findUnique: (...args: unknown[]) => mockMcpFindUnique(...args),
    },
    cloudSession: {
      findMany: (...args: unknown[]) => mockSessionFindMany(...args),
    },
    cloudDecision: {
      groupBy: (...args: unknown[]) => mockDecisionGroupBy(...args),
    },
  },
}))

function makeCtx(project: string) {
  return { params: Promise.resolve({ project }) }
}

describe("GET /api/projects/[project]/sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server")
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)
    const { GET } = await import("@/app/api/projects/[project]/sessions/route")
    const res = await GET(new Request("http://localhost"), makeCtx("birdbot-cloud"))
    expect(res.status).toBe(401)
  })

  it("returns empty sessions when no McpConnection exists", async () => {
    mockMcpFindUnique.mockResolvedValueOnce(null)
    const { GET } = await import("@/app/api/projects/[project]/sessions/route")
    const res = await GET(new Request("http://localhost"), makeCtx("birdbot-cloud"))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.sessions).toEqual([])
  })

  it("returns sessions with decision counts", async () => {
    mockMcpFindUnique.mockResolvedValueOnce({ userToken: "valid-token" })
    mockSessionFindMany.mockResolvedValueOnce([
      { sessionId: "uuid-1", summary: "Built X", createdAt: new Date("2026-04-17") },
    ])
    mockDecisionGroupBy.mockResolvedValueOnce([
      { sessionId: "uuid-1", _count: { id: 3 } },
    ])
    const { GET } = await import("@/app/api/projects/[project]/sessions/route")
    const res = await GET(new Request("http://localhost"), makeCtx("birdbot-cloud"))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.sessions[0]).toMatchObject({
      sessionId: "uuid-1",
      summary: "Built X",
      decisionCount: 3,
    })
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/__tests__/api/projects-sessions.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the route**

Create `src/app/api/projects/[project]/sessions/route.ts`:

```ts
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ project: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { project } = await params

    const connection = await prisma.mcpConnection.findUnique({
      where: { clerkUserId: userId },
    })

    if (!connection) {
      return NextResponse.json({ sessions: [] })
    }

    const { userToken } = connection

    const [sessions, decisionGroups] = await Promise.all([
      prisma.cloudSession.findMany({
        where: { userToken, project },
        orderBy: { createdAt: "desc" },
      }),
      prisma.cloudDecision.groupBy({
        by: ["sessionId"],
        where: { userToken, project, sessionId: { not: null } },
        _count: { id: true },
      }),
    ])

    const countMap = Object.fromEntries(
      decisionGroups
        .filter((d) => d.sessionId != null)
        .map((d) => [d.sessionId!, d._count.id])
    )

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        sessionId: s.sessionId,
        summary: s.summary,
        decisionCount: countMap[s.sessionId] ?? 0,
        createdAt: s.createdAt,
      })),
    })
  } catch (err) {
    console.error("[/api/projects/[project]/sessions] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/api/projects-sessions.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/projects/[project]/sessions/route.ts src/__tests__/api/projects-sessions.test.ts
git commit -m "feat: add GET /api/projects/[project]/sessions endpoint"
```

---

## Task 6: GET /api/projects/[project]/sessions/[sessionId]

**Files:**
- Create: `src/__tests__/api/projects-session-detail.test.ts`
- Create: `src/app/api/projects/[project]/sessions/[sessionId]/route.ts`
- Working directory: `/Users/nicolasbreen/Projects/Birdbot.ai/birdbot-cloud`

**Context:** Clerk auth. Verify the session's `userToken` matches the authenticated user's token — return 404 if not (prevents cross-user access).

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/api/projects-session-detail.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "user_123" }),
}))

const mockMcpFindUnique = vi.fn()
const mockSessionFindUnique = vi.fn()
const mockDecisionFindMany = vi.fn()
vi.mock("@/lib/prisma", () => ({
  prisma: {
    mcpConnection: {
      findUnique: (...args: unknown[]) => mockMcpFindUnique(...args),
    },
    cloudSession: {
      findUnique: (...args: unknown[]) => mockSessionFindUnique(...args),
    },
    cloudDecision: {
      findMany: (...args: unknown[]) => mockDecisionFindMany(...args),
    },
  },
}))

function makeCtx(project: string, sessionId: string) {
  return { params: Promise.resolve({ project, sessionId }) }
}

describe("GET /api/projects/[project]/sessions/[sessionId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server")
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)
    const { GET } = await import("@/app/api/projects/[project]/sessions/[sessionId]/route")
    const res = await GET(new Request("http://localhost"), makeCtx("birdbot-cloud", "uuid-1"))
    expect(res.status).toBe(401)
  })

  it("returns 404 when no McpConnection exists", async () => {
    mockMcpFindUnique.mockResolvedValueOnce(null)
    const { GET } = await import("@/app/api/projects/[project]/sessions/[sessionId]/route")
    const res = await GET(new Request("http://localhost"), makeCtx("birdbot-cloud", "uuid-1"))
    expect(res.status).toBe(404)
  })

  it("returns 404 when session not found", async () => {
    mockMcpFindUnique.mockResolvedValueOnce({ userToken: "valid-token" })
    mockSessionFindUnique.mockResolvedValueOnce(null)
    const { GET } = await import("@/app/api/projects/[project]/sessions/[sessionId]/route")
    const res = await GET(new Request("http://localhost"), makeCtx("birdbot-cloud", "uuid-1"))
    expect(res.status).toBe(404)
  })

  it("returns 404 when session belongs to a different user", async () => {
    mockMcpFindUnique.mockResolvedValueOnce({ userToken: "valid-token" })
    mockSessionFindUnique.mockResolvedValueOnce({
      sessionId: "uuid-1", userToken: "other-token",
      project: "birdbot-cloud", summary: "...", createdAt: new Date(),
    })
    const { GET } = await import("@/app/api/projects/[project]/sessions/[sessionId]/route")
    const res = await GET(new Request("http://localhost"), makeCtx("birdbot-cloud", "uuid-1"))
    expect(res.status).toBe(404)
  })

  it("returns session with decisions", async () => {
    mockMcpFindUnique.mockResolvedValueOnce({ userToken: "valid-token" })
    mockSessionFindUnique.mockResolvedValueOnce({
      sessionId: "uuid-1", userToken: "valid-token",
      project: "birdbot-cloud", summary: "Built X", createdAt: new Date("2026-04-17"),
    })
    mockDecisionFindMany.mockResolvedValueOnce([
      { id: "d1", decision: "Use fire-and-forget", reasoning: "Speed", createdAt: new Date() },
    ])
    const { GET } = await import("@/app/api/projects/[project]/sessions/[sessionId]/route")
    const res = await GET(new Request("http://localhost"), makeCtx("birdbot-cloud", "uuid-1"))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.session).toMatchObject({
      sessionId: "uuid-1",
      project: "birdbot-cloud",
      summary: "Built X",
      decisions: expect.arrayContaining([
        expect.objectContaining({ decision: "Use fire-and-forget" }),
      ]),
    })
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/__tests__/api/projects-session-detail.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the route**

Create `src/app/api/projects/[project]/sessions/[sessionId]/route.ts`:

```ts
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ project: string; sessionId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { sessionId } = await params

    const connection = await prisma.mcpConnection.findUnique({
      where: { clerkUserId: userId },
    })

    if (!connection) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const session = await prisma.cloudSession.findUnique({
      where: { sessionId },
    })

    if (!session || session.userToken !== connection.userToken) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const decisions = await prisma.cloudDecision.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({
      session: {
        sessionId: session.sessionId,
        project: session.project,
        summary: session.summary,
        createdAt: session.createdAt,
        decisions: decisions.map((d) => ({
          id: d.id,
          decision: d.decision,
          reasoning: d.reasoning,
          createdAt: d.createdAt,
        })),
      },
    })
  } catch (err) {
    console.error("[/api/projects/.../sessions/[sessionId]] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass (including pre-existing tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/projects/[project]/sessions/[sessionId]/route.ts src/__tests__/api/projects-session-detail.test.ts
git commit -m "feat: add GET /api/projects/[project]/sessions/[sessionId] endpoint"
```

---

## Task 7: Dashboard projects page — add live project grid

**Files:**
- Modify: `src/app/dashboard/projects/page.tsx`
- Working directory: `/Users/nicolasbreen/Projects/Birdbot.ai/birdbot-cloud`

**Context:** Keep the existing onboarding checklist. Replace the static "No projects yet" placeholder section with a live grid that fetches `/api/projects`. Color tokens in use: `bg-panel`, `border-border`, `text-text-base`, `text-text-muted`, `text-text-dim`, `text-emerald`, `bg-blue`, `bg-depth`, `text-gold`. Use `useRouter` from `next/navigation` for card navigation.

- [ ] **Step 1: Read the current file**

Read `src/app/dashboard/projects/page.tsx` — you must read it before editing.

- [ ] **Step 2: Replace with updated version**

```tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const BRIEFING_COMMAND = `get_briefing({ project: "my-project" })`

type Project = {
  name: string
  sessionCount: number
  decisionCount: number
  lastSessionAt: string | null
}

export default function ProjectsPage() {
  const router = useRouter()
  const [connected, setConnected] = useState(false)
  const [copied, setCopied] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)

  useEffect(() => {
    setConnected(!!localStorage.getItem("bb_connected"))
  }, [])

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => setProjects(data.projects ?? []))
      .catch(() => {})
      .finally(() => setLoadingProjects(false))
  }, [])

  function handleCopyCommand() {
    navigator.clipboard.writeText(BRIEFING_COMMAND).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const steps = [
    {
      num: 1,
      done: true,
      title: "Create your account",
      detail: "You're in.",
    },
    {
      num: 2,
      done: connected,
      title: "Connect your coding tool",
      detail: "Paste the MCP config so BirdBot can remember your sessions.",
      action: (
        <Link
          href="/dashboard/connect"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-sans bg-blue text-white hover:bg-blue-light transition-colors"
        >
          Go to Connect →
        </Link>
      ),
    },
    {
      num: 3,
      done: false,
      title: "Run your first briefing",
      detail: "At the start of any coding session, ask your tool to call:",
      action: (
        <div className="flex items-center gap-2 mt-1">
          <code className="text-xs font-mono text-gold bg-depth border border-border px-3 py-1.5 rounded-lg">
            {BRIEFING_COMMAND}
          </code>
          <button
            onClick={handleCopyCommand}
            className="text-xs font-sans text-text-muted hover:text-text-dim transition-colors px-2 py-1.5 rounded-lg border border-border hover:border-border/60"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h1 className="font-heading font-bold text-2xl text-text-base mb-1">Get Started</h1>
      <p className="text-text-dim font-sans text-sm mb-8">
        Three steps to persistent memory across every coding session.
      </p>

      {/* Checklist */}
      <div className="flex flex-col gap-3 mb-10">
        {steps.map((step) => (
          <div
            key={step.num}
            className={`flex gap-4 p-4 rounded-xl border transition-colors ${
              step.done ? "border-emerald/30 bg-emerald/5" : "border-border bg-panel"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold font-sans border-2 ${
                step.done ? "bg-emerald border-emerald text-white" : "border-border text-text-muted"
              }`}
            >
              {step.done ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              ) : (
                step.num
              )}
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <p className={`text-sm font-semibold font-sans ${step.done ? "text-emerald" : "text-text-base"}`}>
                {step.title}
              </p>
              <p className="text-xs text-text-muted font-sans leading-relaxed">{step.detail}</p>
              {!step.done && step.action && step.action}
            </div>
          </div>
        ))}
      </div>

      {/* Projects */}
      <div className="border-t border-border pt-8">
        <h2 className="font-heading font-semibold text-base text-text-base mb-1">Your Projects</h2>
        <p className="text-text-muted text-sm font-sans mb-6">
          Projects you log via birdbot-mcp will appear here.
        </p>

        {loadingProjects ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-text-muted font-sans">Loading…</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-border border-dashed text-center gap-2">
            <span className="text-3xl select-none">🗂️</span>
            <p className="text-sm font-semibold text-text-dim font-sans">No projects yet</p>
            <p className="text-xs text-text-muted font-sans max-w-xs leading-relaxed">
              Start a session in Claude to see your project history here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {projects.map((p) => (
              <button
                key={p.name}
                onClick={() => router.push(`/dashboard/projects/${encodeURIComponent(p.name)}`)}
                className="text-left p-4 rounded-xl border border-border bg-panel hover:border-blue/50 hover:bg-blue/5 transition-colors"
              >
                <p className="text-sm font-semibold text-text-base font-sans mb-2">{p.name}</p>
                <div className="flex gap-3">
                  <span className="text-xs text-text-muted font-sans">📋 {p.sessionCount}</span>
                  <span className="text-xs text-text-muted font-sans">⚡ {p.decisionCount}</span>
                </div>
                {p.lastSessionAt && (
                  <p className="text-xs text-text-muted font-sans mt-2">
                    Last: {new Date(p.lastSessionAt).toLocaleDateString()}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/projects/page.tsx
git commit -m "feat: add live project grid to projects dashboard page"
```

---

## Task 8: Dashboard — session list page

**Files:**
- Create: `src/app/dashboard/projects/[project]/page.tsx`
- Working directory: `/Users/nicolasbreen/Projects/Birdbot.ai/birdbot-cloud`

**Context:** New client component. `useParams<{ project: string }>()` from `next/navigation` provides the project slug. Fetches `/api/projects/[project]/sessions`. Each session card navigates to the session detail page.

- [ ] **Step 1: Create the file**

```tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

type Session = {
  sessionId: string
  summary: string | null
  decisionCount: number
  createdAt: string
}

export default function ProjectSessionsPage() {
  const params = useParams<{ project: string }>()
  const router = useRouter()
  const project = decodeURIComponent(params.project)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/projects/${encodeURIComponent(project)}/sessions`)
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [project])

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <button
        onClick={() => router.push("/dashboard/projects")}
        className="text-xs text-text-muted font-sans hover:text-text-dim transition-colors mb-6 flex items-center gap-1"
      >
        ← Projects
      </button>

      <h1 className="font-heading font-bold text-2xl text-text-base mb-1">{project}</h1>
      <p className="text-text-dim font-sans text-sm mb-8">Session history</p>

      {loading ? (
        <p className="text-sm text-text-muted font-sans">Loading…</p>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-border border-dashed text-center gap-2">
          <p className="text-sm font-semibold text-text-dim font-sans">No sessions yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((s) => (
            <button
              key={s.sessionId}
              onClick={() =>
                router.push(
                  `/dashboard/projects/${encodeURIComponent(project)}/sessions/${s.sessionId}`
                )
              }
              className="text-left p-4 rounded-xl border border-border bg-panel hover:border-blue/50 hover:bg-blue/5 transition-colors"
            >
              <p className="text-xs text-emerald font-sans mb-1">
                {new Date(s.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                — {s.decisionCount} decision{s.decisionCount !== 1 ? "s" : ""}
              </p>
              <p className="text-sm text-text-base font-sans leading-relaxed line-clamp-2">
                {s.summary ?? "No summary"}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/projects/[project]/page.tsx
git commit -m "feat: add session list page for dashboard projects"
```

---

## Task 9: Dashboard — session detail page

**Files:**
- Create: `src/app/dashboard/projects/[project]/sessions/[sessionId]/page.tsx`
- Working directory: `/Users/nicolasbreen/Projects/Birdbot.ai/birdbot-cloud`

**Context:** New client component. Uses `useParams<{ project: string; sessionId: string }>()`. Fetches `/api/projects/[project]/sessions/[sessionId]`. Shows summary card then decisions list.

- [ ] **Step 1: Create the file**

```tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

type Decision = {
  id: string
  decision: string
  reasoning: string | null
  createdAt: string
}

type Session = {
  sessionId: string
  project: string
  summary: string | null
  createdAt: string
  decisions: Decision[]
}

export default function SessionDetailPage() {
  const params = useParams<{ project: string; sessionId: string }>()
  const router = useRouter()
  const project = decodeURIComponent(params.project)
  const { sessionId } = params
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/projects/${encodeURIComponent(project)}/sessions/${sessionId}`)
      .then((r) => r.json())
      .then((data) => setSession(data.session ?? null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [project, sessionId])

  const dateLabel = session
    ? new Date(session.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : ""

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <button
        onClick={() => router.push(`/dashboard/projects/${encodeURIComponent(project)}`)}
        className="text-xs text-text-muted font-sans hover:text-text-dim transition-colors mb-6 flex items-center gap-1"
      >
        ← {project}
      </button>

      {loading ? (
        <p className="text-sm text-text-muted font-sans">Loading…</p>
      ) : !session ? (
        <p className="text-sm text-text-muted font-sans">Session not found.</p>
      ) : (
        <>
          <h1 className="font-heading font-bold text-2xl text-text-base mb-1">{dateLabel}</h1>
          <p className="text-text-dim font-sans text-sm mb-6">Session detail</p>

          <div className="p-4 rounded-xl border border-border bg-panel mb-8">
            <p className="text-xs text-emerald font-sans uppercase tracking-wider mb-2">
              Session Summary
            </p>
            <p className="text-sm text-text-base font-sans leading-relaxed">
              {session.summary ?? "No summary recorded."}
            </p>
          </div>

          <h2 className="font-heading font-semibold text-base text-text-base mb-4">
            Decisions logged this session
          </h2>

          {session.decisions.length === 0 ? (
            <p className="text-sm text-text-muted font-sans">No decisions logged.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {session.decisions.map((d) => (
                <div key={d.id} className="p-4 rounded-xl border border-border bg-panel">
                  <p className="text-sm text-text-base font-sans font-medium mb-2">
                    ⚡ {d.decision}
                  </p>
                  {d.reasoning && (
                    <p className="text-xs text-text-muted font-sans leading-relaxed">
                      <span className="text-text-dim">Why: </span>
                      {d.reasoning}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/projects/[project]/sessions/[sessionId]/page.tsx
git commit -m "feat: add session detail page for dashboard"
```

---

## Task 10: birdbot-mcp — add session_id column to SQLite

**Files:**
- Modify: `src/db.ts`
- Working directory: `/Users/nicolasbreen/Projects/birdbot-mcp`

**Context:** `getDb()` runs `CREATE TABLE IF NOT EXISTS` on every call. For existing databases, the `session_id` column won't exist yet — add it via `ALTER TABLE`. SQLite doesn't support `ADD COLUMN IF NOT EXISTS`, so check `PRAGMA table_info` first.

- [ ] **Step 1: Read the current file**

Read `src/db.ts` before making changes.

- [ ] **Step 2: Replace with updated version**

```ts
import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const DATA_DIR = join(homedir(), '.birdbot');
const DB_PATH = join(DATA_DIR, 'birdbot.db');

export function getDb(): Database.Database {
  mkdirSync(DATA_DIR, { recursive: true });

  const db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      project    TEXT    NOT NULL DEFAULT 'default',
      summary    TEXT    NOT NULL,
      session_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS decisions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      project    TEXT    NOT NULL DEFAULT 'default',
      decision   TEXT    NOT NULL,
      reasoning  TEXT,
      session_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Add session_id to existing tables that predate this column
  for (const table of ['sessions', 'decisions']) {
    const cols = (db.pragma(`table_info(${table})`) as Array<{ name: string }>).map((c) => c.name);
    if (!cols.includes('session_id')) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN session_id TEXT`);
    }
  }

  return db;
}
```

- [ ] **Step 3: Build to verify TypeScript compiles**

```bash
npm run build
```

Expected: `dist/` updated, no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/db.ts
git commit -m "feat: add session_id column to sessions and decisions tables"
```

---

## Task 11: birdbot-mcp — session_id flow and cloud sync

**Files:**
- Modify: `src/index.ts`
- Working directory: `/Users/nicolasbreen/Projects/birdbot-mcp`

**Context:**
- `get_briefing`: generate `crypto.randomUUID()` as `sessionId`, append it to the returned briefing text so the AI can pass it to later calls.
- `log_session_end`: accept optional `session_id` param, write to SQLite, fire-and-forget POST to `/api/mcp/sessions` with `Authorization: Bearer <token>`.
- `log_decision`: accept optional `session_id` param, write to SQLite, fire-and-forget POST to `/api/mcp/decisions` with `Authorization: Bearer <token>`.
- Base URL: `process.env.BIRDBOT_CLOUD_URL ?? 'https://app.birdbot.ai'`
- Token: `process.env.BIRDBOT_USER_TOKEN`

- [ ] **Step 1: Read the current file**

Read `src/index.ts` before making changes.

- [ ] **Step 2: Replace with updated version**

```ts
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { getDb } from './db.js';
import { synthesizeBriefing } from './synthesis.js';

const BASE_URL = process.env.BIRDBOT_CLOUD_URL ?? 'https://app.birdbot.ai';

const server = new Server(
  { name: 'birdbot', version: '0.1.4' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_briefing',
      description: 'Get a synthesized briefing of the current project state. Call this at the START of every session before doing anything else.',
      inputSchema: {
        type: 'object',
        properties: {
          project: {
            type: 'string',
            description: 'Project name. Use the repo or folder name (e.g. "birdbot-cloud"). Defaults to "default".',
          },
        },
      },
    },
    {
      name: 'log_session_end',
      description: 'Log a summary of this session. Call this at the END of every session.',
      inputSchema: {
        type: 'object',
        properties: {
          summary: {
            type: 'string',
            description: '2-3 sentences: what was built, what was decided, what is still open or blocked.',
          },
          project: {
            type: 'string',
            description: 'Project name. Must match the name used in get_briefing.',
          },
          session_id: {
            type: 'string',
            description: 'Session ID from the briefing. Include this to link the session in the cloud.',
          },
        },
        required: ['summary'],
      },
    },
    {
      name: 'log_decision',
      description: 'Log an architectural or technical decision with its reasoning.',
      inputSchema: {
        type: 'object',
        properties: {
          decision: {
            type: 'string',
            description: 'What was decided.',
          },
          reasoning: {
            type: 'string',
            description: 'Why this decision was made.',
          },
          project: {
            type: 'string',
            description: 'Project name. Must match the name used in get_briefing.',
          },
          session_id: {
            type: 'string',
            description: 'Session ID from the briefing. Include this to link the decision in the cloud.',
          },
        },
        required: ['decision'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const db = getDb();
  const { name, arguments: args } = request.params;
  const project = (args?.project as string | undefined) ?? 'default';
  const token = process.env.BIRDBOT_USER_TOKEN;

  if (name === 'get_briefing') {
    const sessions = db.prepare(
      'SELECT summary, created_at FROM sessions WHERE project = ? ORDER BY created_at DESC LIMIT 10'
    ).all(project) as Array<{ summary: string; created_at: string }>;

    const decisions = db.prepare(
      'SELECT decision, reasoning, created_at FROM decisions WHERE project = ? ORDER BY created_at DESC'
    ).all(project) as Array<{ decision: string; reasoning: string | null; created_at: string }>;

    const briefing = await synthesizeBriefing(sessions, decisions, project);
    const sessionId = crypto.randomUUID();

    if (token) {
      fetch(`${BASE_URL}/api/mcp/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }).catch(() => {});
    }

    return {
      content: [{
        type: 'text',
        text: `${briefing}\n\nSession ID: ${sessionId} — pass this as session_id in log_decision and log_session_end calls.`,
      }],
    };
  }

  if (name === 'log_session_end') {
    const summary = args?.summary as string;
    if (!summary) throw new Error('summary is required');
    const sessionId = (args?.session_id as string | undefined) ?? null;
    db.prepare('INSERT INTO sessions (project, summary, session_id) VALUES (?, ?, ?)').run(project, summary, sessionId);

    if (token && sessionId) {
      fetch(`${BASE_URL}/api/mcp/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ project, sessionId, summary, createdAt: new Date().toISOString() }),
      }).catch(() => {});
    }

    return { content: [{ type: 'text', text: `Session logged for project "${project}".` }] };
  }

  if (name === 'log_decision') {
    const decision = args?.decision as string;
    if (!decision) throw new Error('decision is required');
    const reasoning = (args?.reasoning as string | undefined) ?? null;
    const sessionId = (args?.session_id as string | undefined) ?? null;
    db.prepare('INSERT INTO decisions (project, decision, reasoning, session_id) VALUES (?, ?, ?, ?)').run(project, decision, reasoning, sessionId);

    if (token) {
      fetch(`${BASE_URL}/api/mcp/decisions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ project, sessionId, decision, reasoning, createdAt: new Date().toISOString() }),
      }).catch(() => {});
    }

    return { content: [{ type: 'text', text: `Decision logged for project "${project}".` }] };
  }

  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

- [ ] **Step 3: Build to verify TypeScript compiles**

```bash
npm run build
```

Expected: `dist/` updated, no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: add session_id flow and fire-and-forget cloud sync"
```

---

## Task 12: birdbot-mcp — bump version and publish

**Files:**
- Modify: `package.json`
- Working directory: `/Users/nicolasbreen/Projects/birdbot-mcp`

- [ ] **Step 1: Update version in package.json**

Change `"version": "0.1.3"` to `"version": "0.1.4"`.

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "chore: bump version to 0.1.4"
```

- [ ] **Step 3: Publish to npm**

```bash
npm publish
```

Expected: Published `birdbot-mcp@0.1.4`.

- [ ] **Step 4: Verify**

```bash
npm view birdbot-mcp version
```

Expected: `0.1.4`
