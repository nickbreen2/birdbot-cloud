import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "user_123" }),
}))

const mockCount = vi.fn()
const mockCreate = vi.fn()
vi.mock("@/lib/prisma", () => ({
  prisma: {
    whatsAppPairingToken: {
      count: (...a: unknown[]) => mockCount(...a),
      create: (...a: unknown[]) => mockCreate(...a),
    },
  },
}))

process.env.WHATSAPP_PHONE_NUMBER_ID = "123456789"

describe("POST /api/whatsapp/pair", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server")
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)
    const { POST } = await import("@/app/api/whatsapp/pair/route")
    const res = await POST()
    expect(res.status).toBe(401)
  })

  it("creates a token and returns code + expiresAt when under rate limit", async () => {
    mockCount.mockResolvedValueOnce(2)
    mockCreate.mockResolvedValueOnce({})
    const { POST } = await import("@/app/api/whatsapp/pair/route")
    const res = await POST()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.token).toMatch(/^[0-9A-F]{6}$/)
    expect(body.expiresAt).toBeDefined()
    expect(mockCreate).toHaveBeenCalledOnce()
  })

  it("returns 429 when rate limit is reached (5 tokens in window)", async () => {
    mockCount.mockResolvedValueOnce(5)
    const { POST } = await import("@/app/api/whatsapp/pair/route")
    const res = await POST()
    expect(res.status).toBe(429)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("stores token with correct userId and 15-minute TTL", async () => {
    mockCount.mockResolvedValueOnce(0)
    mockCreate.mockResolvedValueOnce({})
    const before = Date.now()
    const { POST } = await import("@/app/api/whatsapp/pair/route")
    await POST()
    const createCall = mockCreate.mock.calls[0][0]
    expect(createCall.data.userId).toBe("user_123")
    const expiresAt = new Date(createCall.data.expiresAt).getTime()
    expect(expiresAt).toBeGreaterThan(before + 14 * 60 * 1000)
    expect(expiresAt).toBeLessThan(before + 16 * 60 * 1000)
  })
})
