import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "user_123" }),
}))

const mockCount = vi.fn()
const mockCreate = vi.fn()
vi.mock("@/lib/prisma", () => ({
  prisma: {
    telegramPairingToken: {
      count: (...args: unknown[]) => mockCount(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}))

process.env.TELEGRAM_BOT_USERNAME = "testbot"

describe("POST /api/telegram/pair", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server")
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)
    const { POST } = await import("@/app/api/telegram/pair/route")
    const res = await POST()
    expect(res.status).toBe(401)
  })

  it("creates a token and returns deepLink when under rate limit", async () => {
    mockCount.mockResolvedValueOnce(2)
    mockCreate.mockResolvedValueOnce({})
    const { POST } = await import("@/app/api/telegram/pair/route")
    const res = await POST()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deepLink).toMatch(/^https:\/\/t\.me\/testbot\?start=/)
    expect(mockCreate).toHaveBeenCalledOnce()
  })

  it("returns 429 when rate limit is reached (5 tokens in window)", async () => {
    mockCount.mockResolvedValueOnce(5)
    const { POST } = await import("@/app/api/telegram/pair/route")
    const res = await POST()
    expect(res.status).toBe(429)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("allows exactly 4 tokens (boundary: 4 is under limit)", async () => {
    mockCount.mockResolvedValueOnce(4)
    mockCreate.mockResolvedValueOnce({})
    const { POST } = await import("@/app/api/telegram/pair/route")
    const res = await POST()
    expect(res.status).toBe(200)
    expect(mockCreate).toHaveBeenCalledOnce()
  })

  it("passes correct count query (userId + 15-minute window)", async () => {
    mockCount.mockResolvedValueOnce(0)
    mockCreate.mockResolvedValueOnce({})
    const { POST } = await import("@/app/api/telegram/pair/route")
    await POST()
    expect(mockCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user_123",
          createdAt: expect.objectContaining({ gt: expect.any(Date) }),
        }),
      })
    )
  })
})
