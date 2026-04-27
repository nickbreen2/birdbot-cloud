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
