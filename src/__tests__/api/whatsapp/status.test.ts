import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "user_123" }),
}))

const mockFindUnique = vi.fn()
const mockFindFirst = vi.fn()
vi.mock("@/lib/prisma", () => ({
  prisma: {
    whatsAppUser: { findUnique: (...a: unknown[]) => mockFindUnique(...a) },
    whatsAppPairingToken: { findFirst: (...a: unknown[]) => mockFindFirst(...a) },
  },
}))

describe("GET /api/whatsapp/status", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server")
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)
    const { GET } = await import("@/app/api/whatsapp/status/route")
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("returns connected: true when WhatsAppUser exists", async () => {
    mockFindUnique.mockResolvedValueOnce({ phoneNumber: "+15551234567" })
    // findFirst is not called when waUser exists — no mock setup needed
    const { GET } = await import("@/app/api/whatsapp/status/route")
    const res = await GET()
    const body = await res.json()
    expect(body.connected).toBe(true)
    expect(body.tokenExpired).toBe(false)
  })

  it("returns connected: false and tokenExpired: true when token is expired", async () => {
    mockFindUnique.mockResolvedValueOnce(null)
    mockFindFirst.mockResolvedValueOnce({ expiresAt: new Date(Date.now() - 1000) })
    const { GET } = await import("@/app/api/whatsapp/status/route")
    const res = await GET()
    const body = await res.json()
    expect(body.connected).toBe(false)
    expect(body.tokenExpired).toBe(true)
  })

  it("returns connected: false and tokenExpired: false when no token exists", async () => {
    mockFindUnique.mockResolvedValueOnce(null)
    mockFindFirst.mockResolvedValueOnce(null)
    const { GET } = await import("@/app/api/whatsapp/status/route")
    const res = await GET()
    const body = await res.json()
    expect(body.connected).toBe(false)
    expect(body.tokenExpired).toBe(false)
  })
})
