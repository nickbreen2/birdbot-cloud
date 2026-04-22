import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "user_123" }),
}))

const mockMcpFindUnique = vi.fn()
const mockCloudProjectFindMany = vi.fn()
const mockSessionGroupBy = vi.fn()
const mockDecisionGroupBy = vi.fn()
vi.mock("@/lib/prisma", () => ({
  prisma: {
    mcpConnection: {
      findUnique: (...args: unknown[]) => mockMcpFindUnique(...args),
    },
    cloudProject: {
      findMany: (...args: unknown[]) => mockCloudProjectFindMany(...args),
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
    mockCloudProjectFindMany.mockResolvedValueOnce([
      { name: "birdbot-cloud", createdAt: new Date("2026-04-17") },
    ])
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
