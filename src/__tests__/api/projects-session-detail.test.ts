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
