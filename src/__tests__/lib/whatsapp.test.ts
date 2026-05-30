import { describe, it, expect, vi, beforeEach } from "vitest"

const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

process.env.WHATSAPP_PHONE_NUMBER_ID = "123456789"
process.env.WHATSAPP_ACCESS_TOKEN = "test_token"

describe("sendWhatsAppMessage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("posts to Meta Graph API with correct body", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })
    const { sendWhatsAppMessage } = await import("@/lib/whatsapp")
    await sendWhatsAppMessage("+15551234567", "Hello Bird")
    expect(mockFetch).toHaveBeenCalledWith(
      "https://graph.facebook.com/v21.0/123456789/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test_token",
        }),
        body: expect.stringContaining('"type":"text"'),
      })
    )
  })

  it("strips + prefix from phone number in request body", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })
    const { sendWhatsAppMessage } = await import("@/lib/whatsapp")
    await sendWhatsAppMessage("+15551234567", "Hi")
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.to).toBe("15551234567")
  })

  it("does not throw on API error (logs only)", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 400, text: async () => "bad request" })
    const { sendWhatsAppMessage } = await import("@/lib/whatsapp")
    await expect(sendWhatsAppMessage("+15551234567", "Hi")).resolves.toBeUndefined()
  })
})

describe("sendWhatsAppTemplate", () => {
  beforeEach(() => vi.clearAllMocks())

  it("posts template message with correct template name", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })
    const { sendWhatsAppTemplate } = await import("@/lib/whatsapp")
    await sendWhatsAppTemplate("+15551234567", "bird_checkin_v1")
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.type).toBe("template")
    expect(body.template.name).toBe("bird_checkin_v1")
    expect(body.template.language.code).toBe("en")
  })
})
