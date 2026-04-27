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
