import { describe, it, expect, vi, beforeEach } from "vitest"

const mockEncrypt = vi.fn((v: string) => `enc:${v}`)
vi.mock("@/lib/tokenEncryption", () => ({
  encrypt: (v: string) => mockEncrypt(v),
}))

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: vi.fn().mockResolvedValue({
    users: {
      getUser: vi.fn().mockResolvedValue({ publicMetadata: { onboardingComplete: true } }),
      updateUser: vi.fn().mockResolvedValue({}),
    },
  }),
}))

const mockUpsert = vi.fn().mockResolvedValue({})
vi.mock("@/lib/prisma", () => ({
  prisma: { googleConnection: { upsert: (...args: unknown[]) => mockUpsert(...args) } },
}))

vi.mock("@/lib/google", () => ({
  buildOAuthClient: vi.fn().mockReturnValue({
    getToken: vi.fn().mockResolvedValue({
      tokens: {
        access_token: "raw_access_token",
        refresh_token: "raw_refresh_token",
        expiry_date: Date.now() + 3600000,
        scope: "https://www.googleapis.com/auth/gmail.modify",
      },
    }),
    setCredentials: vi.fn(),
  }),
  verifyState: vi.fn().mockReturnValue("user_123"),
}))

vi.mock("googleapis", () => ({
  google: {
    oauth2: vi.fn().mockReturnValue({
      userinfo: { get: vi.fn().mockResolvedValue({ data: { email: "test@example.com" } }) },
    }),
  },
}))

process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000"

describe("GET /api/google/callback — token encryption", () => {
  beforeEach(() => vi.clearAllMocks())

  it("encrypts accessToken and refreshToken before upserting", async () => {
    const { GET } = await import("@/app/api/google/callback/route")
    const req = new Request("http://localhost:3000/api/google/callback?code=authcode&state=validstate")
    await GET(req as never)

    expect(mockEncrypt).toHaveBeenCalledWith("raw_access_token")
    expect(mockEncrypt).toHaveBeenCalledWith("raw_refresh_token")

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          accessToken: "enc:raw_access_token",
          refreshToken: "enc:raw_refresh_token",
        }),
        update: expect.objectContaining({
          accessToken: "enc:raw_access_token",
          refreshToken: "enc:raw_refresh_token",
        }),
      })
    )
  })
})
