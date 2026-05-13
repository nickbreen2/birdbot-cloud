import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock @trigger.dev/sdk so schedules.task exposes .run for unit testing
vi.mock("@trigger.dev/sdk", () => ({
  schedules: {
    task: (config: { run: (...args: unknown[]) => unknown }) => ({
      run: config.run,
    }),
  },
}))

const mockDecrypt = vi.fn((v: string) => v.replace(/^enc:/, ""))
const mockEncrypt = vi.fn((v: string) => `enc:${v}`)
vi.mock("@/lib/tokenEncryption", () => ({
  decrypt: (v: string) => mockDecrypt(v),
  encrypt: (v: string) => mockEncrypt(v),
}))

const mockFindMany = vi.fn()
const mockUpdate = vi.fn()
vi.mock("@/lib/prisma", () => ({
  prisma: {
    googleConnection: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}))

const mockSetCredentials = vi.fn()
const mockRefreshAccessToken = vi.fn()
const mockHandleTokenRevoked = vi.fn()
vi.mock("@/lib/google", () => ({
  buildOAuthClient: vi.fn().mockReturnValue({
    setCredentials: (...args: unknown[]) => mockSetCredentials(...args),
    refreshAccessToken: (...args: unknown[]) => mockRefreshAccessToken(...args),
  }),
  handleTokenRevoked: (...args: unknown[]) => mockHandleTokenRevoked(...args),
}))

describe("googleTokenRefreshCron", () => {
  beforeEach(() => vi.clearAllMocks())

  it("decrypts refreshToken before setting credentials", async () => {
    mockFindMany.mockResolvedValueOnce([
      { userId: "user_1", refreshToken: "enc:raw_refresh_token" },
    ])
    mockRefreshAccessToken.mockResolvedValueOnce({
      credentials: { access_token: "new_at", expiry_date: Date.now() + 3600000 },
    })
    mockUpdate.mockResolvedValueOnce({})

    const { googleTokenRefreshCron } = await import("@/trigger/googleTokenRefresh")
    await googleTokenRefreshCron.run({} as never, {} as never)

    expect(mockDecrypt).toHaveBeenCalledWith("enc:raw_refresh_token")
    expect(mockSetCredentials).toHaveBeenCalledWith({ refresh_token: "raw_refresh_token" })
  })

  it("encrypts new accessToken before writing back to DB", async () => {
    mockFindMany.mockResolvedValueOnce([
      { userId: "user_1", refreshToken: "enc:raw_refresh_token" },
    ])
    mockRefreshAccessToken.mockResolvedValueOnce({
      credentials: { access_token: "new_at", expiry_date: Date.now() + 3600000 },
    })
    mockUpdate.mockResolvedValueOnce({})

    const { googleTokenRefreshCron } = await import("@/trigger/googleTokenRefresh")
    await googleTokenRefreshCron.run({} as never, {} as never)

    expect(mockEncrypt).toHaveBeenCalledWith("new_at")
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ accessToken: "enc:new_at" }),
      })
    )
  })

  it("calls handleTokenRevoked on refresh failure", async () => {
    mockFindMany.mockResolvedValueOnce([
      { userId: "user_1", refreshToken: "enc:expired_refresh_token" },
    ])
    mockRefreshAccessToken.mockRejectedValueOnce(new Error("invalid_grant"))

    const { googleTokenRefreshCron } = await import("@/trigger/googleTokenRefresh")
    await googleTokenRefreshCron.run({} as never, {} as never)

    expect(mockHandleTokenRevoked).toHaveBeenCalledWith("user_1")
  })

  it("processes nothing when no tokens are expiring", async () => {
    mockFindMany.mockResolvedValueOnce([])

    const { googleTokenRefreshCron } = await import("@/trigger/googleTokenRefresh")
    await googleTokenRefreshCron.run({} as never, {} as never)

    expect(mockRefreshAccessToken).not.toHaveBeenCalled()
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
