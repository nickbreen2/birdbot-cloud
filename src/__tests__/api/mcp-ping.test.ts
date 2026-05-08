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
