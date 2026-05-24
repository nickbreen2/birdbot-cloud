import { describe, it, expect, vi, beforeEach } from "vitest"
import { createHmac } from "crypto"

const mockTrigger = vi.fn()
vi.mock("@trigger.dev/sdk", () => ({ tasks: { trigger: (...a: unknown[]) => mockTrigger(...a) } }))

const mockFindToken = vi.fn()
const mockFindWaUser = vi.fn()
vi.mock("@/lib/prisma", () => ({
  prisma: {
    whatsAppPairingToken: { findUnique: (...a: unknown[]) => mockFindToken(...a) },
    whatsAppUser: { findUnique: (...a: unknown[]) => mockFindWaUser(...a) },
  },
}))

process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = "verify_secret"
process.env.WHATSAPP_APP_SECRET = "app_secret"

function makeRequest(body: object, secret = "app_secret") {
  const payload = JSON.stringify(body)
  const sig = "sha256=" + createHmac("sha256", secret).update(payload).digest("hex")
  return new Request("https://example.com/api/whatsapp/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-hub-signature-256": sig },
    body: payload,
  })
}

function makeGetRequest(token = "verify_secret") {
  return new Request(
    `https://example.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${token}&hub.challenge=abc123`
  )
}

describe("GET /api/whatsapp/webhook", () => {
  it("returns hub.challenge when verify token matches", async () => {
    const { GET } = await import("@/app/api/whatsapp/webhook/route")
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toBe("abc123")
  })

  it("returns 403 when verify token does not match", async () => {
    const { GET } = await import("@/app/api/whatsapp/webhook/route")
    const res = await GET(makeGetRequest("wrong"))
    expect(res.status).toBe(403)
  })
})

describe("POST /api/whatsapp/webhook", () => {
  beforeEach(() => vi.clearAllMocks())

  const inboundPayload = {
    object: "whatsapp_business_account",
    entry: [{ changes: [{ value: { messages: [{ from: "15551234567", type: "text", text: { body: "AB12CD" } }] } }] }],
  }

  it("returns 403 when signature is invalid", async () => {
    const { POST } = await import("@/app/api/whatsapp/webhook/route")
    const payload = JSON.stringify(inboundPayload)
    const req = new Request("https://example.com", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-hub-signature-256": "sha256=bad" },
      body: payload,
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it("fires whatsapp-process task when signature is valid and user exists", async () => {
    mockFindToken.mockResolvedValueOnce(null)
    mockFindWaUser.mockResolvedValueOnce({ userId: "user_123" })
    mockTrigger.mockResolvedValueOnce({})
    const { POST } = await import("@/app/api/whatsapp/webhook/route")
    const res = await POST(makeRequest(inboundPayload))
    expect(res.status).toBe(200)
    expect(mockTrigger).toHaveBeenCalledWith(
      "whatsapp-process",
      expect.objectContaining({ phoneNumber: "15551234567", text: "AB12CD" })
    )
  })

  it("fires whatsapp-process task with pairingUserId when pairing token is valid", async () => {
    mockFindToken.mockResolvedValueOnce({
      userId: "user_456",
      token: "AB12CD",
      usedAt: null,
      expiresAt: new Date(Date.now() + 3600000),
    })
    mockTrigger.mockResolvedValueOnce({})
    const { POST } = await import("@/app/api/whatsapp/webhook/route")
    const res = await POST(makeRequest(inboundPayload))
    expect(res.status).toBe(200)
    expect(mockTrigger).toHaveBeenCalledWith(
      "whatsapp-process",
      expect.objectContaining({
        phoneNumber: "15551234567",
        pairingUserId: "user_456",
        pairingToken: "AB12CD",
      })
    )
  })

  it("returns 200 silently when no user or token found", async () => {
    mockFindToken.mockResolvedValueOnce(null)
    mockFindWaUser.mockResolvedValueOnce(null)
    const { POST } = await import("@/app/api/whatsapp/webhook/route")
    const res = await POST(makeRequest(inboundPayload))
    expect(res.status).toBe(200)
    expect(mockTrigger).not.toHaveBeenCalled()
  })
})
