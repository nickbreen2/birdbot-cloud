# MVP Redesign — Projects Brain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a cloud briefing endpoint, remove the agent creation wizard and incubating gate, and redesign the Projects and Connect pages so users get a personalized copyable prompt instead of MCP config tabs.

**Architecture:** `GET /api/mcp/briefing` generates a session briefing + session_id using BirdBot's Anthropic key and returns it to the calling AI. The dashboard's "New Project" flow gives users a personalized prompt (token + project name pre-filled) to paste into their coding tool. The wizard overlay and incubating gate are deleted; the dashboard goes straight to the Projects tab.

**Tech Stack:** Next.js 15 App Router, Prisma 6 + Neon, `@anthropic-ai/sdk`, vitest, Tailwind CSS, Clerk v7

---

## File Structure

**Create:**
- `src/lib/synthesis.ts` — `synthesizeBriefing()` function (ported from birdbot-mcp, uses BirdBot's Anthropic key)
- `src/app/api/mcp/briefing/route.ts` — `GET /api/mcp/briefing?project=X`, Bearer token auth
- `src/__tests__/api/mcp-briefing.test.ts` — 5 unit tests for the briefing endpoint
- `src/components/dashboard/NewProjectModal.tsx` — two-step modal: name input → copyable prompt

**Modify:**
- `src/app/dashboard/layout.tsx` — remove `AgentSetupWizard` and `IncubatingGate` (keep `WizardProvider`, `SettingsModal`, `AccountModal`)
- `src/app/dashboard/projects/page.tsx` — remove checklist, add "New Project" button + modal
- `src/app/dashboard/connect/page.tsx` — replace tool tabs with prompt UI + MCP toggle

**Delete:**
- `src/components/dashboard/AgentSetupWizard.tsx`
- `src/components/dashboard/IncubatingGate.tsx`

> **Do NOT delete** `WizardContext.tsx`, `SettingsModal.tsx`, `AccountModal.tsx`, or any file in `src/components/wizard/` — they are still used by the settings and account modals.

---

## Task 1: Install Anthropic SDK + port synthesis module

**Files:**
- Modify: `package.json` (npm install)
- Create: `src/lib/synthesis.ts`

- [ ] **Step 1: Install the Anthropic SDK**

```bash
npm install @anthropic-ai/sdk
```

Expected: `added X packages` with no errors.

- [ ] **Step 2: Create `src/lib/synthesis.ts`**

```ts
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

const MODEL = process.env.BIRDBOT_MODEL ?? "claude-sonnet-4-6"

interface Session {
  summary: string
  created_at: string
}

interface Decision {
  decision: string
  reasoning: string | null
  created_at: string
}

export async function synthesizeBriefing(
  sessions: Session[],
  decisions: Decision[],
  project: string
): Promise<string> {
  if (sessions.length === 0 && decisions.length === 0) {
    return `No history yet for project "${project}". This is the first session — start building and log decisions as you go.`
  }

  const sessionsText = sessions
    .map(s => `[${s.created_at}] ${s.summary}`)
    .join("\n")

  const decisionsText = decisions
    .map(d => `[${d.created_at}] ${d.decision}${d.reasoning ? ` — ${d.reasoning}` : ""}`)
    .join("\n")

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: `You are BirdBot, a project memory layer for vibe coders. Synthesize project history into a sharp, useful briefing for an AI coding assistant starting a new session.

Rules:
- 3-5 sentences maximum. No headers, no bullet points — one paragraph.
- Be opinionated: flag contradictions, surface relevant pitfalls, connect patterns the developer might not have noticed.
- End with the single most important open item or next step if one is clear.
- Write like a technical collaborator handing off to a colleague, not a scribe reciting notes.`,
    messages: [
      {
        role: "user",
        content: `Project: ${project}

Recent sessions (newest first):
${sessionsText || "None yet."}

Architectural decisions:
${decisionsText || "None logged yet."}

Generate the session briefing.`,
      },
    ],
  })

  const textBlock = response.content.find(b => b.type === "text")
  return textBlock?.text ?? ""
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/lib/synthesis.ts
git commit -m "feat: add synthesis module with cloud briefing generation"
```

---

## Task 2: `GET /api/mcp/briefing` endpoint + tests

**Files:**
- Create: `src/app/api/mcp/briefing/route.ts`
- Create: `src/__tests__/api/mcp-briefing.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/api/mcp-briefing.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

const mockFindUnique = vi.fn()
const mockFindManySession = vi.fn()
const mockFindManyDecision = vi.fn()
const mockSynthesize = vi.fn()

vi.mock("@/lib/prisma", () => ({
  prisma: {
    mcpConnection: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    cloudSession: {
      findMany: (...args: unknown[]) => mockFindManySession(...args),
    },
    cloudDecision: {
      findMany: (...args: unknown[]) => mockFindManyDecision(...args),
    },
  },
}))

vi.mock("@/lib/synthesis", () => ({
  synthesizeBriefing: (...args: unknown[]) => mockSynthesize(...args),
}))

function makeRequest(token?: string, project?: string) {
  const url = `http://localhost/api/mcp/briefing${project ? `?project=${project}` : ""}`
  return new Request(url, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

describe("GET /api/mcp/briefing", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFindManySession.mockResolvedValue([])
    mockFindManyDecision.mockResolvedValue([])
  })

  it("returns 401 when no Authorization header", async () => {
    const { GET } = await import("@/app/api/mcp/briefing/route")
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })

  it("returns 401 when token not found in DB", async () => {
    mockFindUnique.mockResolvedValueOnce(null)
    const { GET } = await import("@/app/api/mcp/briefing/route")
    const res = await GET(makeRequest("bad-token", "birdbot-cloud"))
    expect(res.status).toBe(401)
  })

  it("returns 400 when project query param is missing", async () => {
    mockFindUnique.mockResolvedValueOnce({ userToken: "valid-token" })
    const { GET } = await import("@/app/api/mcp/briefing/route")
    const res = await GET(makeRequest("valid-token"))
    expect(res.status).toBe(400)
  })

  it("returns briefing and sessionId for valid request", async () => {
    mockFindUnique.mockResolvedValueOnce({ userToken: "valid-token" })
    mockSynthesize.mockResolvedValueOnce("Last session you built the Stripe webhook.")
    const { GET } = await import("@/app/api/mcp/briefing/route")
    const res = await GET(makeRequest("valid-token", "birdbot-cloud"))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.briefing).toBe("Last session you built the Stripe webhook.")
    expect(typeof body.sessionId).toBe("string")
    expect(body.sessionId).toMatch(/^[0-9a-f-]{36}$/)
  })

  it("returns first-session message when no history exists", async () => {
    mockFindUnique.mockResolvedValueOnce({ userToken: "valid-token" })
    mockSynthesize.mockResolvedValueOnce(
      'No history yet for project "birdbot-cloud". This is the first session — start building and log decisions as you go.'
    )
    const { GET } = await import("@/app/api/mcp/briefing/route")
    const res = await GET(makeRequest("valid-token", "birdbot-cloud"))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.briefing).toContain("first session")
    expect(typeof body.sessionId).toBe("string")
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --reporter=verbose src/__tests__/api/mcp-briefing.test.ts
```

Expected: FAIL — `Cannot find module '@/app/api/mcp/briefing/route'`

- [ ] **Step 3: Create `src/app/api/mcp/briefing/route.ts`**

```ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { synthesizeBriefing } from "@/lib/synthesis"

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const project = searchParams.get("project")

    if (!project) {
      return NextResponse.json({ error: "project is required" }, { status: 400 })
    }

    const [cloudSessions, cloudDecisions] = await Promise.all([
      prisma.cloudSession.findMany({
        where: { userToken: token, project },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.cloudDecision.findMany({
        where: { userToken: token, project },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ])

    const sessions = cloudSessions.map(s => ({
      summary: s.summary ?? "",
      created_at: s.createdAt.toISOString(),
    }))

    const decisions = cloudDecisions.map(d => ({
      decision: d.decision,
      reasoning: d.reasoning,
      created_at: d.createdAt.toISOString(),
    }))

    const briefing = await synthesizeBriefing(sessions, decisions, project)
    const sessionId = crypto.randomUUID()

    return NextResponse.json({ briefing, sessionId })
  } catch (err) {
    console.error("[/api/mcp/briefing] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run all tests and confirm they pass**

```bash
npm test
```

Expected: all tests pass including the 5 new briefing tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/mcp/briefing/route.ts src/__tests__/api/mcp-briefing.test.ts
git commit -m "feat: add GET /api/mcp/briefing endpoint with cloud synthesis"
```

---

## Task 3: Remove wizard overlay and incubating gate

**Files:**
- Modify: `src/app/dashboard/layout.tsx`
- Delete: `src/components/dashboard/AgentSetupWizard.tsx`
- Delete: `src/components/dashboard/IncubatingGate.tsx`

> **Important:** Do NOT delete `WizardContext.tsx` or files in `src/components/wizard/` — `SettingsModal` and `AccountModal` still depend on them.

- [ ] **Step 1: Replace `src/app/dashboard/layout.tsx`**

```tsx
import { Sidebar } from "@/components/dashboard/Sidebar"
import { MobileHeader } from "@/components/dashboard/MobileHeader"
import { BottomTabBar } from "@/components/dashboard/BottomTabBar"
import { SettingsModal } from "@/components/dashboard/SettingsModal"
import { AccountModal } from "@/components/dashboard/AccountModal"
import { WizardProvider } from "@/components/dashboard/WizardContext"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WizardProvider>
      <div className="min-h-screen bg-depth flex">
        <Sidebar />
        <MobileHeader />
        <main className="flex-1 lg:ml-64 min-h-screen pt-14 lg:pt-0 pb-16 lg:pb-0">
          {children}
        </main>
        <BottomTabBar />
        <SettingsModal />
        <AccountModal />
      </div>
    </WizardProvider>
  )
}
```

- [ ] **Step 2: Delete the two unused component files**

```bash
rm src/components/dashboard/AgentSetupWizard.tsx
rm src/components/dashboard/IncubatingGate.tsx
```

- [ ] **Step 3: Verify TypeScript compiles and tests pass**

```bash
npx tsc --noEmit && npm test
```

Expected: no errors, all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/layout.tsx
git rm src/components/dashboard/AgentSetupWizard.tsx src/components/dashboard/IncubatingGate.tsx
git commit -m "feat: remove agent wizard and incubating gate from dashboard"
```

---

## Task 4: `NewProjectModal` component

**Files:**
- Create: `src/components/dashboard/NewProjectModal.tsx`

- [ ] **Step 1: Create `src/components/dashboard/NewProjectModal.tsx`**

```tsx
"use client"

import { useState, useEffect } from "react"

function buildPrompt(token: string, projectName: string): string {
  return `## BirdBot Memory

You have access to BirdBot — a persistent memory layer for this project.

At the START of every session, call:
  GET https://app.birdbot.ai/api/mcp/briefing?project=${projectName}
  Authorization: Bearer ${token}
Read the returned briefing as your project context. Use the returned sessionId in all subsequent BirdBot calls this session.

When you make a significant architectural decision, call:
  POST https://app.birdbot.ai/api/mcp/decisions
  Authorization: Bearer ${token}
  Body: { "project": "${projectName}", "sessionId": "<sessionId from briefing>", "decision": "...", "reasoning": "..." }

At the END of every session, call:
  POST https://app.birdbot.ai/api/mcp/sessions
  Authorization: Bearer ${token}
  Body: { "project": "${projectName}", "sessionId": "<sessionId from briefing>", "summary": "..." }`
}

export function NewProjectModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"name" | "prompt">("name")
  const [projectName, setProjectName] = useState("")
  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch("/api/connection/token")
      .then(r => r.json())
      .then((data: { token?: string }) => {
        if (data.token) setToken(data.token)
      })
      .catch(() => {})
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (projectName.trim()) setStep("prompt")
  }

  function handleCopy() {
    if (!token) return
    navigator.clipboard.writeText(buildPrompt(token, projectName.trim())).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(6,9,18,0.92)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border overflow-hidden"
        style={{ background: "#111827" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-8 py-7">
          {step === "name" ? (
            <>
              <h2 className="font-heading font-bold text-xl text-text-base mb-2">New Project</h2>
              <p className="text-text-muted text-sm font-sans mb-6">
                Name your project to get a personalized connection prompt.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="e.g. birdbot-cloud"
                  autoFocus
                  className="w-full bg-depth border border-border rounded-xl px-4 py-3 text-sm font-mono text-text-base placeholder:text-text-muted focus:outline-none focus:border-blue transition-colors"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!projectName.trim()}
                    className="bg-blue text-white font-semibold font-sans text-sm px-6 py-2.5 rounded-xl hover:bg-blue-light transition-colors disabled:opacity-40"
                  >
                    Continue →
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h2 className="font-heading font-bold text-xl text-text-base mb-2">
                Connect {projectName}
              </h2>
              <p className="text-text-muted text-sm font-sans mb-4">
                Paste this into your project&apos;s{" "}
                <code className="text-gold font-mono text-xs bg-depth px-1.5 py-0.5 rounded border border-border">
                  CLAUDE.md
                </code>{" "}
                or coding tool system instructions.
              </p>
              <div className="relative bg-depth border border-border rounded-xl p-4 mb-6">
                <pre className="text-xs font-mono text-text-dim leading-relaxed whitespace-pre-wrap overflow-x-auto pr-16">
                  {token ? buildPrompt(token, projectName.trim()) : "Loading your token…"}
                </pre>
                <button
                  onClick={handleCopy}
                  disabled={!token}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-[11px] font-semibold font-sans border border-border bg-panel text-text-dim hover:text-text-base transition-colors disabled:opacity-40"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setStep("name")}
                  className="text-xs text-text-muted hover:text-text-dim font-sans transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={onClose}
                  className="bg-blue text-white font-semibold font-sans text-sm px-6 py-2.5 rounded-xl hover:bg-blue-light transition-colors"
                >
                  Done →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/NewProjectModal.tsx
git commit -m "feat: add NewProjectModal — name input then personalized copyable prompt"
```

---

## Task 5: Redesign Projects page

**Files:**
- Modify: `src/app/dashboard/projects/page.tsx`

Replace the full file content:

- [ ] **Step 1: Replace `src/app/dashboard/projects/page.tsx`**

```tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { NewProjectModal } from "@/components/dashboard/NewProjectModal"

type Project = {
  name: string
  sessionCount: number
  decisionCount: number
  lastSessionAt: string | null
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json())
      .then((data: { projects?: Project[] }) => setProjects(data.projects ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-base mb-1">Your Projects</h1>
          <p className="text-text-dim font-sans text-sm">
            Sessions from your coding tool appear here automatically.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue text-white font-semibold font-sans text-sm px-4 py-2.5 rounded-xl hover:bg-blue-light transition-colors"
        >
          <span className="text-base leading-none">+</span>
          New Project
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-text-muted font-sans">Loading…</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-border border-dashed text-center gap-3">
          <p className="text-sm font-semibold text-text-dim font-sans">No projects yet</p>
          <p className="text-xs text-text-muted font-sans max-w-xs leading-relaxed">
            Create a project to get your connection prompt, or sessions will appear automatically once you start using BirdBot.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-2 bg-blue text-white font-semibold font-sans text-sm px-4 py-2 rounded-xl hover:bg-blue-light transition-colors"
          >
            + New Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {projects.map(p => (
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

      {showModal && <NewProjectModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles and tests pass**

```bash
npx tsc --noEmit && npm test
```

Expected: no errors, all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/projects/page.tsx
git commit -m "feat: redesign Projects page — remove checklist, add New Project modal"
```

---

## Task 6: Redesign Connect page

**Files:**
- Modify: `src/app/dashboard/connect/page.tsx`

Replace the full file content. The new page:
- Fetches the user's token and their existing projects
- If projects exist: shows a project selector + personalized prompt
- If no projects: shows a message to create one first
- Has a "Prefer MCP config instead?" toggle that reveals the existing JSON snippet
- Keeps the connection status indicator

- [ ] **Step 1: Replace `src/app/dashboard/connect/page.tsx`**

```tsx
"use client"

import { useState, useEffect, useRef } from "react"

function buildPrompt(token: string, projectName: string): string {
  return `## BirdBot Memory

You have access to BirdBot — a persistent memory layer for this project.

At the START of every session, call:
  GET https://app.birdbot.ai/api/mcp/briefing?project=${projectName}
  Authorization: Bearer ${token}
Read the returned briefing as your project context. Use the returned sessionId in all subsequent BirdBot calls this session.

When you make a significant architectural decision, call:
  POST https://app.birdbot.ai/api/mcp/decisions
  Authorization: Bearer ${token}
  Body: { "project": "${projectName}", "sessionId": "<sessionId from briefing>", "decision": "...", "reasoning": "..." }

At the END of every session, call:
  POST https://app.birdbot.ai/api/mcp/sessions
  Authorization: Bearer ${token}
  Body: { "project": "${projectName}", "sessionId": "<sessionId from briefing>", "summary": "..." }`
}

function buildMcpSnippet(token: string): string {
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

type Project = { name: string }

export default function ConnectPage() {
  const [token, setToken] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [mcpCopied, setMcpCopied] = useState(false)
  const [showMcp, setShowMcp] = useState(false)
  const [connected, setConnected] = useState(false)
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch("/api/connection/token")
      .then(r => r.json())
      .then((data: { token?: string }) => {
        if (data.token) setToken(data.token)
      })
      .catch(() => {})

    fetch("/api/projects")
      .then(r => r.json())
      .then((data: { projects?: Project[] }) => {
        const list = data.projects ?? []
        setProjects(list)
        if (list.length > 0) setSelectedProject(list[0].name)
      })
      .catch(() => {})

    function checkStatus() {
      fetch("/api/connection/status")
        .then(r => r.json())
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

  function handleCopy() {
    if (!token || !selectedProject) return
    navigator.clipboard.writeText(buildPrompt(token, selectedProject)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleMcpCopy() {
    if (!token) return
    navigator.clipboard.writeText(buildMcpSnippet(token)).then(() => {
      setMcpCopied(true)
      setTimeout(() => setMcpCopied(false), 2000)
    })
  }

  const hasProjects = projects.length > 0

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h1 className="font-heading font-bold text-2xl text-text-base mb-1">Connect your coding tool</h1>
      <p className="text-text-dim font-sans text-sm mb-8">
        Paste this into your project&apos;s{" "}
        <code className="font-mono text-xs bg-depth border border-border px-1.5 py-0.5 rounded text-text-dim">
          CLAUDE.md
        </code>{" "}
        or coding tool system instructions. BirdBot will start remembering your sessions.
      </p>

      {hasProjects ? (
        <>
          {/* Project selector */}
          {projects.length > 1 && (
            <div className="mb-4">
              <label className="text-[11px] font-semibold font-sans text-text-muted uppercase tracking-widest block mb-2">
                Project
              </label>
              <select
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                className="w-full bg-depth border border-border rounded-xl px-4 py-2.5 text-sm font-mono text-text-base focus:outline-none focus:border-blue transition-colors"
              >
                {projects.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Prompt block */}
          <div className="relative rounded-xl bg-depth border border-border overflow-hidden mb-4">
            {!token ? (
              <div className="p-5 h-48 flex items-center justify-center">
                <span className="text-xs text-text-muted font-mono animate-pulse">Loading your token…</span>
              </div>
            ) : (
              <pre className="text-xs font-mono text-text-dim p-5 overflow-x-auto leading-relaxed whitespace-pre pr-20">
                {buildPrompt(token, selectedProject)}
              </pre>
            )}
            <button
              onClick={handleCopy}
              disabled={!token || !selectedProject}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-[11px] font-semibold font-sans border border-border bg-panel text-text-dim hover:text-text-base hover:border-border/60 transition-colors disabled:opacity-40"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-border border-dashed text-center gap-2 mb-4">
          <p className="text-sm font-semibold text-text-dim font-sans">No projects yet</p>
          <p className="text-xs text-text-muted font-sans max-w-xs leading-relaxed">
            Create a project in the Projects tab to get your personalized connection prompt.
          </p>
        </div>
      )}

      {/* MCP toggle */}
      <button
        onClick={() => setShowMcp(v => !v)}
        className="text-xs text-text-muted hover:text-text-dim font-sans underline underline-offset-2 mb-4 block transition-colors"
      >
        {showMcp ? "Hide MCP config" : "Prefer MCP config instead?"}
      </button>

      {showMcp && (
        <div className="relative rounded-xl bg-depth border border-border overflow-hidden mb-6">
          {!token ? (
            <div className="p-5 h-36 flex items-center justify-center">
              <span className="text-xs text-text-muted font-mono animate-pulse">Loading…</span>
            </div>
          ) : (
            <pre className="text-xs font-mono text-text-dim p-5 overflow-x-auto leading-relaxed whitespace-pre">
              {buildMcpSnippet(token)}
            </pre>
          )}
          <button
            onClick={handleMcpCopy}
            disabled={!token}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-[11px] font-semibold font-sans border border-border bg-panel text-text-dim hover:text-text-base hover:border-border/60 transition-colors disabled:opacity-40"
          >
            {mcpCopied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}

      {/* Connection status */}
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${
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
            <span className="text-xs font-semibold font-sans text-text-muted">Waiting for connection…</span>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run all tests and verify TypeScript**

```bash
npx tsc --noEmit && npm test
```

Expected: no errors, all 43+ tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/connect/page.tsx
git commit -m "feat: redesign Connect page — copyable prompt primary, MCP config toggle"
```
