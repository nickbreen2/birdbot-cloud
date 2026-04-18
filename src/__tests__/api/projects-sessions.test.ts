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
