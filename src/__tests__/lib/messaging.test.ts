import { describe, it, expect, vi, beforeEach } from "vitest"

const mockSendTelegram = vi.fn()
const mockSendWhatsApp = vi.fn()
const mockSendWhatsAppTemplate = vi.fn()

vi.mock("@/lib/telegram", () => ({ sendTelegramMessage: (...a: unknown[]) => mockSendTelegram(...a) }))
vi.mock("@/lib/whatsapp", () => ({
  sendWhatsAppMessage: (...a: unknown[]) => mockSendWhatsApp(...a),
  sendWhatsAppTemplate: (...a: unknown[]) => mockSendWhatsAppTemplate(...a),
}))

const mockPrismaPrefs = vi.fn()
const mockPrismaWa = vi.fn()
const mockPrismaTg = vi.fn()
const mockPrismaWaUpdate = vi.fn()
const mockPrismaTgUpdate = vi.fn()

vi.mock("@/lib/prisma", () => ({
  prisma: {
    userPreferences: { findUnique: (...a: unknown[]) => mockPrismaPrefs(...a) },
    whatsAppUser: {
      findUnique: (...a: unknown[]) => mockPrismaWa(...a),
      update: (...a: unknown[]) => mockPrismaWaUpdate(...a),
    },
    telegramUser: {
      findUnique: (...a: unknown[]) => mockPrismaTg(...a),
      update: (...a: unknown[]) => mockPrismaTgUpdate(...a),
    },
  },
}))

process.env.NEXT_PUBLIC_APP_URL = "https://birdbot.ai"

describe("sendMessage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("routes to WhatsApp free-form when home is whatsapp and within 24h window", async () => {
    mockPrismaPrefs.mockResolvedValueOnce({ homeChannel: "whatsapp", personalityPreset: "assistant" })
    mockPrismaWa.mockResolvedValueOnce({ phoneNumber: "+15551234567", lastInboundAt: new Date() })
    const { sendMessage } = await import("@/lib/messaging")
    await sendMessage("user_123", "Hello")
    expect(mockSendWhatsApp).toHaveBeenCalledWith("+15551234567", "Hello")
    expect(mockSendWhatsAppTemplate).not.toHaveBeenCalled()
  })

  it("routes to WhatsApp template when home is whatsapp and outside 24h window", async () => {
    mockPrismaPrefs.mockResolvedValueOnce({ homeChannel: "whatsapp", personalityPreset: "assistant" })
    const old = new Date(Date.now() - 25 * 60 * 60 * 1000)
    mockPrismaWa.mockResolvedValueOnce({ phoneNumber: "+15551234567", lastInboundAt: old })
    const { sendMessage } = await import("@/lib/messaging")
    await sendMessage("user_123", "Hello")
    expect(mockSendWhatsAppTemplate).toHaveBeenCalledWith("+15551234567", "bird_checkin_v1")
    expect(mockSendWhatsApp).not.toHaveBeenCalled()
  })

  it("routes to Telegram when home is telegram", async () => {
    mockPrismaPrefs.mockResolvedValueOnce({ homeChannel: "telegram" })
    mockPrismaTg.mockResolvedValueOnce({ telegramChatId: "999" })
    const { sendMessage } = await import("@/lib/messaging")
    await sendMessage("user_123", "Hello")
    expect(mockSendTelegram).toHaveBeenCalledWith("999", "Hello")
  })

  it("does nothing when homeChannel is null", async () => {
    mockPrismaPrefs.mockResolvedValueOnce({ homeChannel: null })
    const { sendMessage } = await import("@/lib/messaging")
    await sendMessage("user_123", "Hello")
    expect(mockSendTelegram).not.toHaveBeenCalled()
    expect(mockSendWhatsApp).not.toHaveBeenCalled()
  })
})

describe("sendRedirectMessage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("sends redirect on WhatsApp when Telegram is home and redirect cooldown has passed", async () => {
    mockPrismaPrefs.mockResolvedValueOnce({ homeChannel: "telegram" })
    mockPrismaWa.mockResolvedValueOnce({ phoneNumber: "+15551234567", lastRedirectAt: null })
    mockPrismaWaUpdate.mockResolvedValueOnce({})
    const { sendRedirectMessage } = await import("@/lib/messaging")
    await sendRedirectMessage("user_123", "whatsapp")
    expect(mockSendWhatsApp).toHaveBeenCalledWith(
      "+15551234567",
      expect.stringContaining("Telegram")
    )
    expect(mockPrismaWaUpdate).toHaveBeenCalled()
  })

  it("skips redirect when cooldown is still active (< 24h since last redirect)", async () => {
    mockPrismaPrefs.mockResolvedValueOnce({ homeChannel: "telegram" })
    mockPrismaWa.mockResolvedValueOnce({ phoneNumber: "+15551234567", lastRedirectAt: new Date() })
    const { sendRedirectMessage } = await import("@/lib/messaging")
    await sendRedirectMessage("user_123", "whatsapp")
    expect(mockSendWhatsApp).not.toHaveBeenCalled()
  })
})
