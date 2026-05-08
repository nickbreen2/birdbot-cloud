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
