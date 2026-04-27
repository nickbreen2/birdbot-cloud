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
