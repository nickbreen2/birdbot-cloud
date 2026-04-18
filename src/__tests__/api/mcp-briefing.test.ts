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
