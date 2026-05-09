import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const mocks = vi.hoisted(() => ({
  verifyState: vi.fn(),
  buildOAuthClient: vi.fn(),
  getToken: vi.fn(),
  setCredentials: vi.fn(),
  userinfoGet: vi.fn(),
  upsert: vi.fn(),
  clerkGetUser: vi.fn(),
  clerkUpdateUser: vi.fn(),
}))

vi.mock("@/lib/google", () => ({
  verifyState: mocks.verifyState,
  buildOAuthClient: mocks.buildOAuthClient,
}))

vi.mock("googleapis", () => ({
  google: {
    oauth2: vi.fn().mockReturnValue({ userinfo: { get: mocks.userinfoGet } }),
  },
}))

vi.mock("@/lib/prisma", () => ({
  prisma: { googleConnection: { upsert: mocks.upsert } },
}))

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: vi.fn().mockResolvedValue({
    users: {
      getUser: mocks.clerkGetUser,
      updateUser: mocks.clerkUpdateUser,
    },
  }),
}))

process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000"

import { GET } from "@/app/api/google/callback/route"

describe("GET /api/google/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.buildOAuthClient.mockReturnValue({
      getToken: mocks.getToken,
      setCredentials: mocks.setCredentials,
    })
    mocks.clerkGetUser.mockResolvedValue({ publicMetadata: {} })
    mocks.clerkUpdateUser.mockResolvedValue({})
  })

  it("redirects to error page when state is invalid", async () => {
    mocks.verifyState.mockReturnValue(null)
    const req = new NextRequest("http://localhost:3000/api/google/callback?code=abc&state=bad")
    const res = await GET(req)
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("google=error")
  })

  it("redirects to error page when code is absent", async () => {
    const req = new NextRequest("http://localhost:3000/api/google/callback?state=validstate")
    const res = await GET(req)
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("google=error")
  })

  it("stores tokens and redirects to integrations on success", async () => {
    mocks.verifyState.mockReturnValue("user_1")
    mocks.getToken.mockResolvedValue({
      tokens: {
        access_token: "at",
        refresh_token: "rt",
        expiry_date: Date.now() + 3600000,
        scope: "https://www.googleapis.com/auth/calendar",
      },
    })
    mocks.userinfoGet.mockResolvedValue({ data: { email: "nick@example.com" } })
    mocks.upsert.mockResolvedValue({})

    const req = new NextRequest("http://localhost:3000/api/google/callback?code=goodcode&state=validstate")
    const res = await GET(req)

    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("google=connected")
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ userId: "user_1", email: "nick@example.com" }),
      })
    )
  })
})
