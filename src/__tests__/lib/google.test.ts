import { describe, it, expect, vi, beforeEach } from "vitest"

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findUnique_tg: vi.fn(),
  setCredentials: vi.fn(),
  refreshAccessToken: vi.fn(),
  sendTelegramMessage: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    googleConnection: {
      findUnique: mocks.findUnique,
      update: mocks.update,
      delete: mocks.delete,
    },
    telegramUser: {
      findUnique: mocks.findUnique_tg,
    },
  },
}))

vi.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: vi.fn(function () {
        return {
          setCredentials: mocks.setCredentials,
          refreshAccessToken: mocks.refreshAccessToken,
          generateAuthUrl: vi.fn().mockReturnValue("https://accounts.google.com/o/oauth2/auth"),
        }
      }),
    },
  },
}))

vi.mock("@/lib/telegram", () => ({
  sendTelegramMessage: mocks.sendTelegramMessage,
}))

process.env.GOOGLE_CLIENT_ID = "test-client-id"
process.env.GOOGLE_CLIENT_SECRET = "test-client-secret"
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000"
process.env.GOOGLE_OAUTH_STATE_SECRET = "test-secret-32-bytes-padding-here"

import { createState, verifyState, getGoogleClient, handleTokenRevoked } from "@/lib/google"

describe("createState / verifyState", () => {
  it("round-trips a userId", () => {
    const state = createState("user_abc123")
    expect(verifyState(state)).toBe("user_abc123")
  })

  it("returns null for a tampered state", () => {
    const state = createState("user_abc123")
    const last = state.at(-1)!
    const tampered = state.slice(0, -1) + (last === "a" ? "b" : "a")
    expect(verifyState(tampered)).toBeNull()
  })

  it("returns null for an empty string", () => {
    expect(verifyState("")).toBeNull()
  })

  it("returns null for malformed state (no colon)", () => {
    const badState = Buffer.from("nocolonhere").toString("base64url")
    expect(verifyState(badState)).toBeNull()
  })
})

describe("getGoogleClient", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns a client without refreshing when token has 1 hour left", async () => {
    mocks.findUnique.mockResolvedValue({
      userId: "user_1",
      accessToken: "at",
      refreshToken: "rt",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    })

    const client = await getGoogleClient("user_1")
    expect(client).toBeDefined()
    expect(mocks.setCredentials).toHaveBeenCalledWith({ access_token: "at", refresh_token: "rt" })
    expect(mocks.refreshAccessToken).not.toHaveBeenCalled()
  })

  it("refreshes when token expires in less than 5 minutes", async () => {
    mocks.findUnique.mockResolvedValue({
      userId: "user_1",
      accessToken: "old_at",
      refreshToken: "rt",
      expiresAt: new Date(Date.now() + 2 * 60 * 1000),
    })
    mocks.refreshAccessToken.mockResolvedValue({
      credentials: { access_token: "new_at", expiry_date: Date.now() + 3600000 },
    })

    await getGoogleClient("user_1")
    expect(mocks.refreshAccessToken).toHaveBeenCalledOnce()
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ accessToken: "new_at" }) })
    )
  })

  it("throws when no connection exists", async () => {
    mocks.findUnique.mockResolvedValue(null)
    await expect(getGoogleClient("user_no_google")).rejects.toThrow()
  })
})

describe("handleTokenRevoked", () => {
  beforeEach(() => vi.clearAllMocks())

  it("deletes the connection and sends a Telegram message", async () => {
    mocks.delete.mockResolvedValue({})
    mocks.findUnique_tg.mockResolvedValue({ telegramChatId: "12345" })

    await handleTokenRevoked("user_1")

    expect(mocks.delete).toHaveBeenCalledWith({ where: { userId: "user_1" } })
    expect(mocks.sendTelegramMessage).toHaveBeenCalledWith(12345, expect.stringContaining("disconnected"))
  })

  it("skips Telegram message when user has no Telegram account", async () => {
    mocks.delete.mockResolvedValue({})
    mocks.findUnique_tg.mockResolvedValue(null)

    await handleTokenRevoked("user_1")
    expect(mocks.sendTelegramMessage).not.toHaveBeenCalled()
  })
})
