# Connection Detection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tie a local birdbot-mcp install to a cloud account so the dashboard Connect page shows a real-time "Connected" state when the MCP pings our API.

**Architecture:** A new `McpConnection` Neon Postgres table stores a per-user secret token and `lastSeenAt` timestamp. Three API routes handle token retrieval, MCP pings, and status polling. The Connect page fetches the token on mount (pre-filling the snippet), then polls the status endpoint every 5 seconds until a ping arrives.

**Tech Stack:** Next.js App Router route handlers, Prisma + Neon, Clerk (server-side auth), Vitest (tests), TypeScript ESM (birdbot-mcp side)

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `prisma/schema.prisma` | Add `McpConnection` model |
| Create | `src/app/api/connection/token/route.ts` | GET — find-or-create token for authed user |
| Create | `src/app/api/mcp/ping/route.ts` | POST — unauthenticated, update `lastSeenAt` |
| Create | `src/app/api/connection/status/route.ts` | GET — return `connected` bool for authed user |
| Create | `src/__tests__/api/connection-token.test.ts` | Tests for token route |
| Create | `src/__tests__/api/mcp-ping.test.ts` | Tests for ping route |
| Create | `src/__tests__/api/connection-status.test.ts` | Tests for status route |
| Modify | `src/app/dashboard/connect/page.tsx` | Token pre-fill + connection status polling UI |
| Modify | `../birdbot-mcp/src/index.ts` | Fire-and-forget ping in `get_briefing` |
| Modify | `../birdbot-mcp/package.json` | Bump version to 0.1.3 |

---

### Task 1: Add McpConnection to Prisma schema and migrate

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the McpConnection model**

Open `prisma/schema.prisma` and append after the `Subscription` model:

```prisma
model McpConnection {
  id          String    @id @default(cuid())
  clerkUserId String    @unique
  userToken   String    @unique
  lastSeenAt  DateTime?
  createdAt   DateTime  @default(now())

  @@index([userToken])
}
```

- [ ] **Step 2: Run the migration**

```bash
cd birdbot-cloud
npx prisma migrate dev --name add-mcp-connection
```

Expected: migration file created under `prisma/migrations/`, Prisma client regenerated automatically.

- [ ] **Step 3: Verify the generated client has the new model**

```bash
grep -r "mcpConnection" src/generated/prisma/
```

Expected: at least one match showing the model is in the generated client.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add McpConnection table for MCP ping tracking"
```

---

### Task 2: GET /api/connection/token route

**Files:**
- Create: `src/app/api/connection/token/route.ts`
- Create: `src/__tests__/api/connection-token.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/api/connection-token.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "user_123" }),
}))

const mockFindUnique = vi.fn()
const mockCreate = vi.fn()
vi.mock("@/lib/prisma", () => ({
  prisma: {
    mcpConnection: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}))

describe("GET /api/connection/token", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server")
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)
    const { GET } = await import("@/app/api/connection/token/route")
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("returns existing token when connection already exists", async () => {
    mockFindUnique.mockResolvedValueOnce({ userToken: "existing-uuid", lastSeenAt: null })
    const { GET } = await import("@/app/api/connection/token/route")
    const res = await GET()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.token).toBe("existing-uuid")
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("creates and returns new token when no connection exists", async () => {
    mockFindUnique.mockResolvedValueOnce(null)
    mockCreate.mockResolvedValueOnce({ userToken: "new-uuid", lastSeenAt: null })
    const { GET } = await import("@/app/api/connection/token/route")
    const res = await GET()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.token).toBe("new-uuid")
    expect(mockCreate).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/api/connection-token.test.ts
```

Expected: FAIL — `Cannot find module '@/app/api/connection/token/route'`

- [ ] **Step 3: Implement the route**

Create `src/app/api/connection/token/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let connection = await prisma.mcpConnection.findUnique({
      where: { clerkUserId: userId },
    })

    if (!connection) {
      connection = await prisma.mcpConnection.create({
        data: {
          clerkUserId: userId,
          userToken: crypto.randomUUID(),
        },
      })
    }

    return NextResponse.json({
      token: connection.userToken,
      lastSeenAt: connection.lastSeenAt,
    })
  } catch (err) {
    console.error("[/api/connection/token] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
npx vitest run src/__tests__/api/connection-token.test.ts
```

Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/connection/token/route.ts src/__tests__/api/connection-token.test.ts
git commit -m "feat: add GET /api/connection/token route"
```

---

### Task 3: POST /api/mcp/ping route

**Files:**
- Create: `src/app/api/mcp/ping/route.ts`
- Create: `src/__tests__/api/mcp-ping.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/api/mcp-ping.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"

const mockFindUnique = vi.fn()
const mockUpdate = vi.fn()
vi.mock("@/lib/prisma", () => ({
  prisma: {
    mcpConnection: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}))

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/mcp/ping", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/mcp/ping", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 when token is missing", async () => {
    const { POST } = await import("@/app/api/mcp/ping/route")
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it("returns 404 when token not found", async () => {
    mockFindUnique.mockResolvedValueOnce(null)
    const { POST } = await import("@/app/api/mcp/ping/route")
    const res = await POST(makeRequest({ token: "unknown-token" }))
    expect(res.status).toBe(404)
  })

  it("updates lastSeenAt and returns 200 on valid token", async () => {
    mockFindUnique.mockResolvedValueOnce({ userToken: "valid-uuid" })
    mockUpdate.mockResolvedValueOnce({})
    const { POST } = await import("@/app/api/mcp/ping/route")
    const res = await POST(makeRequest({ token: "valid-uuid" }))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { userToken: "valid-uuid" },
      data: { lastSeenAt: expect.any(Date) },
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/api/mcp-ping.test.ts
```

Expected: FAIL — `Cannot find module '@/app/api/mcp/ping/route'`

- [ ] **Step 3: Implement the route**

Create `src/app/api/mcp/ping/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const { token } = (await request.json()) as { token?: string }

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "token required" }, { status: 400 })
    }

    const connection = await prisma.mcpConnection.findUnique({
      where: { userToken: token },
    })

    if (!connection) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.mcpConnection.update({
      where: { userToken: token },
      data: { lastSeenAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[/api/mcp/ping] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
npx vitest run src/__tests__/api/mcp-ping.test.ts
```

Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/mcp/ping/route.ts src/__tests__/api/mcp-ping.test.ts
git commit -m "feat: add POST /api/mcp/ping route"
```

---

### Task 4: GET /api/connection/status route

**Files:**
- Create: `src/app/api/connection/status/route.ts`
- Create: `src/__tests__/api/connection-status.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/api/connection-status.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "user_123" }),
}))

const mockFindUnique = vi.fn()
vi.mock("@/lib/prisma", () => ({
  prisma: {
    mcpConnection: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}))

describe("GET /api/connection/status", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server")
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)
    const { GET } = await import("@/app/api/connection/status/route")
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("returns connected:false when no connection row exists", async () => {
    mockFindUnique.mockResolvedValueOnce(null)
    const { GET } = await import("@/app/api/connection/status/route")
    const res = await GET()
    const body = await res.json()
    expect(body.connected).toBe(false)
    expect(body.lastSeenAt).toBeNull()
  })

  it("returns connected:false when lastSeenAt is null", async () => {
    mockFindUnique.mockResolvedValueOnce({ lastSeenAt: null })
    const { GET } = await import("@/app/api/connection/status/route")
    const res = await GET()
    const body = await res.json()
    expect(body.connected).toBe(false)
  })

  it("returns connected:true when lastSeenAt is recent", async () => {
    mockFindUnique.mockResolvedValueOnce({ lastSeenAt: new Date() })
    const { GET } = await import("@/app/api/connection/status/route")
    const res = await GET()
    const body = await res.json()
    expect(body.connected).toBe(true)
    expect(body.lastSeenAt).toBeTruthy()
  })

  it("returns connected:false when lastSeenAt is older than 30 days", async () => {
    const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000)
    mockFindUnique.mockResolvedValueOnce({ lastSeenAt: oldDate })
    const { GET } = await import("@/app/api/connection/status/route")
    const res = await GET()
    const body = await res.json()
    expect(body.connected).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/api/connection-status.test.ts
```

Expected: FAIL — `Cannot find module '@/app/api/connection/status/route'`

- [ ] **Step 3: Implement the route**

Create `src/app/api/connection/status/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const connection = await prisma.mcpConnection.findUnique({
      where: { clerkUserId: userId },
    })

    if (!connection || !connection.lastSeenAt) {
      return NextResponse.json({ connected: false, lastSeenAt: null })
    }

    const age = Date.now() - connection.lastSeenAt.getTime()
    const connected = age <= THIRTY_DAYS_MS

    return NextResponse.json({
      connected,
      lastSeenAt: connection.lastSeenAt.toISOString(),
    })
  } catch (err) {
    console.error("[/api/connection/status] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: all tests PASS (existing + 3 new test files)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/connection/status/route.ts src/__tests__/api/connection-status.test.ts
git commit -m "feat: add GET /api/connection/status route"
```

---

### Task 5: Add ping call to birdbot-mcp

**Files:**
- Modify: `/Users/nicolasbreen/Projects/birdbot-mcp/src/index.ts` (lines 76–86, the `get_briefing` handler)
- Modify: `/Users/nicolasbreen/Projects/birdbot-mcp/package.json`

- [ ] **Step 1: Add the ping call in get_briefing**

In `/Users/nicolasbreen/Projects/birdbot-mcp/src/index.ts`, replace the `get_briefing` block:

```typescript
  if (name === 'get_briefing') {
    const sessions = db.prepare(
      'SELECT summary, created_at FROM sessions WHERE project = ? ORDER BY created_at DESC LIMIT 10'
    ).all(project) as Array<{ summary: string; created_at: string }>;

    const decisions = db.prepare(
      'SELECT decision, reasoning, created_at FROM decisions WHERE project = ? ORDER BY created_at DESC'
    ).all(project) as Array<{ decision: string; reasoning: string | null; created_at: string }>;

    const briefing = await synthesizeBriefing(sessions, decisions, project);

    const token = process.env.BIRDBOT_USER_TOKEN;
    if (token) {
      fetch('https://app.birdbot.ai/api/mcp/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }).catch(() => {});
    }

    return { content: [{ type: 'text', text: briefing }] };
  }
```

- [ ] **Step 2: Bump version in package.json**

In `/Users/nicolasbreen/Projects/birdbot-mcp/package.json`, change:

```json
"version": "0.1.2",
```

to:

```json
"version": "0.1.3",
```

- [ ] **Step 3: Build and verify TypeScript compiles**

```bash
cd /Users/nicolasbreen/Projects/birdbot-mcp
npm run build
```

Expected: `dist/index.js` updated, no TypeScript errors.

- [ ] **Step 4: Publish to npm**

```bash
npm publish
```

Expected: `+ birdbot-mcp@0.1.3` confirmation.

- [ ] **Step 5: Commit**

```bash
git add src/index.ts package.json
git commit -m "feat: fire-and-forget ping to BirdBot cloud on get_briefing"
```

---

### Task 6: Update Connect page with token pre-fill and connection status

**Files:**
- Modify: `src/app/dashboard/connect/page.tsx`

- [ ] **Step 1: Replace the Connect page**

Replace the full contents of `src/app/dashboard/connect/page.tsx` with:

```typescript
"use client"

import { useState, useEffect, useRef } from "react"

const TOOLS = [
  { id: "claude", label: "Claude Code", file: "~/.claude/settings.json" },
  { id: "cursor", label: "Cursor",      file: "~/.cursor/mcp.json" },
  { id: "windsurf", label: "Windsurf",  file: "~/.codeium/windsurf/mcp_config.json" },
] as const

function buildSnippet(token: string) {
  return `{
  "mcpServers": {
    "birdbot": {
      "command": "npx",
      "args": ["-y", "birdbot-mcp"],
      "env": {
        "ANTHROPIC_API_KEY": "YOUR_KEY_HERE",
        "BIRDBOT_USER_TOKEN": "${token}"
      }
    }
  }
}`
}

export default function ConnectPage() {
  const [activeTab, setActiveTab] = useState<string>("claude")
  const [copied, setCopied] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [tokenError, setTokenError] = useState(false)
  const [connected, setConnected] = useState(false)
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    localStorage.setItem("bb_connected", "1")

    fetch("/api/connection/token")
      .then((r) => r.json())
      .then((data: { token?: string }) => {
        if (data.token) setToken(data.token)
        else setTokenError(true)
      })
      .catch(() => setTokenError(true))

    function checkStatus() {
      fetch("/api/connection/status")
        .then((r) => r.json())
        .then((data: { connected?: boolean; lastSeenAt?: string | null }) => {
          if (data.connected) {
            setConnected(true)
            setLastSeenAt(data.lastSeenAt ?? null)
            if (pollRef.current) clearInterval(pollRef.current)
          }
        })
        .catch(() => {})
    }

    checkStatus()
    pollRef.current = setInterval(checkStatus, 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const tool = TOOLS.find((t) => t.id === activeTab)!
  const snippet = buildSnippet(token ?? "YOUR_TOKEN_HERE")

  function handleCopy() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h1 className="font-heading font-bold text-2xl text-text-base mb-1">Connect your coding tool</h1>
      <p className="text-text-dim font-sans text-sm mb-8">
        Paste the snippet below into your MCP config file and restart your tool. BirdBot will start remembering your sessions.
      </p>

      {/* Tool tabs */}
      <div className="flex gap-1 bg-depth border border-border rounded-xl p-1 mb-4">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold font-sans transition-colors ${
              activeTab === t.id
                ? "bg-blue text-white"
                : "text-text-muted hover:text-text-base"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* File path */}
      <p className="text-[11px] text-text-muted font-mono mb-3">
        Config file: <span className="text-text-dim">{tool.file}</span>
      </p>

      {/* Snippet */}
      <div className="relative rounded-xl bg-depth border border-border overflow-hidden mb-4">
        {!token && !tokenError ? (
          <div className="p-5 h-44 flex items-center justify-center">
            <span className="text-xs text-text-muted font-mono animate-pulse">Loading your token...</span>
          </div>
        ) : (
          <pre className="text-xs font-mono text-text-dim p-5 overflow-x-auto leading-relaxed whitespace-pre">
            {snippet}
          </pre>
        )}
        <button
          onClick={handleCopy}
          disabled={!token}
          className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-[11px] font-semibold font-sans border border-border bg-panel text-text-dim hover:text-text-base hover:border-border/60 transition-colors disabled:opacity-40"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Connection status */}
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border mb-6 ${
        connected ? "border-emerald/30 bg-emerald/5" : "border-border bg-panel"
      }`}>
        {connected ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald flex-shrink-0" />
            <span className="text-xs font-semibold font-sans text-emerald">Connected</span>
            {lastSeenAt && (
              <span className="text-xs text-text-muted font-sans ml-auto">
                Last seen: {new Date(lastSeenAt).toLocaleString()}
              </span>
            )}
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-400/60 animate-pulse flex-shrink-0" />
            <span className="text-xs font-semibold font-sans text-text-muted">Waiting for connection...</span>
          </>
        )}
      </div>

      {/* API key note */}
      <div className="flex gap-3 p-4 rounded-xl bg-gold/5 border border-gold/20 mb-6">
        <span className="text-gold text-base flex-shrink-0 mt-0.5">ℹ</span>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-gold font-sans">Anthropic API key required</p>
          <p className="text-xs text-text-muted font-sans leading-relaxed">
            Replace <span className="font-mono text-gold">YOUR_KEY_HERE</span> with a key from{" "}
            <span className="font-mono text-text-dim">console.anthropic.com</span>. This key stays on your machine — BirdBot never sees it.
          </p>
        </div>
      </div>

      {/* Step-by-step */}
      <div className="border-t border-border pt-6">
        <h2 className="font-heading font-semibold text-sm text-text-base mb-4">What to do next</h2>
        <ol className="flex flex-col gap-3">
          {[
            "Open your tool's MCP config file at the path shown above",
            "Paste the snippet (merge it in if you already have other MCP servers)",
            "Replace YOUR_KEY_HERE with your Anthropic API key",
            "Save and restart your coding tool",
            "At the start of your next session, ask it to call get_briefing",
          ].map((step, i) => (
            <li key={i} className="flex gap-3 text-sm font-sans text-text-dim">
              <span className="w-5 h-5 rounded-full bg-panel border border-border flex items-center justify-center text-[10px] font-bold text-text-muted flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /Users/nicolasbreen/Projects/Birdbot.ai/birdbot-cloud
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Start the dev server and verify the page visually**

```bash
npm run dev
```

Open `http://localhost:3000/dashboard/connect`. Verify:
- Snippet shows "Loading your token..." skeleton briefly, then token appears
- Status bar shows amber pulsing dot and "Waiting for connection..."
- After calling `get_briefing` in Claude Code (with the new MCP config), the status flips to green "Connected"

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/connect/page.tsx
git commit -m "feat: Connect page — token pre-fill and live connection status"
```

---

### Task 7: Push the branch

- [ ] **Step 1: Push to remote**

```bash
git push
```

Expected: branch pushed to `feature/mvp-connect-step` on GitHub.
