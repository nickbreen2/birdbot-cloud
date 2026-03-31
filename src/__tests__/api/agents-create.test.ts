// src/__tests__/api/agents-create.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockUpdateUserMetadata = vi.fn().mockResolvedValue({})
const mockClerkClient = vi.fn().mockResolvedValue({
  users: { updateUserMetadata: mockUpdateUserMetadata },
})
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "user_123" }),
  clerkClient: mockClerkClient,
}))

const mockFetch = vi.fn().mockResolvedValue({ ok: true })
vi.stubGlobal("fetch", mockFetch)

const validPayload = {
  name: "Atlas",
  model: "kimi-k2.5",
  traits: {
    professional: 50, friendly: 50, unhinged: 0,
    creative: 0, direct: 0, humor: 0, analytical: 0, supportive: 0,
  },
  focusAreas: ["email", "research"],
  channels: ["web"],
  createdAt: "2026-03-31T00:00:00.000Z",
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/agents/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/agents/create", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({ ok: true })
    mockUpdateUserMetadata.mockResolvedValue({})
    mockClerkClient.mockResolvedValue({
      users: { updateUserMetadata: mockUpdateUserMetadata },
    })
    process.env.ADMIN_EMAIL = "admin@birdbot.ai"
    process.env.ADMIN_WEBHOOK_URL = "https://hooks.example.com/birdbot"
  })

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server")
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)
    const { POST } = await import("@/app/api/agents/create/route")
    const res = await POST(makeRequest(validPayload))
    expect(res.status).toBe(401)
  })

  it("returns 400 when name is missing", async () => {
    const { POST } = await import("@/app/api/agents/create/route")
    const res = await POST(makeRequest({ ...validPayload, name: "" }))
    expect(res.status).toBe(400)
  })

  it("returns 400 when focusAreas is empty", async () => {
    const { POST } = await import("@/app/api/agents/create/route")
    const res = await POST(makeRequest({ ...validPayload, focusAreas: [] }))
    expect(res.status).toBe(400)
  })

  it("saves onboarded=true and agent data to Clerk metadata", async () => {
    const { POST } = await import("@/app/api/agents/create/route")
    const res = await POST(makeRequest(validPayload))
    expect(res.status).toBe(200)
    expect(mockUpdateUserMetadata).toHaveBeenCalledWith("user_123", {
      publicMetadata: {
        onboarded: true,
        agent: expect.objectContaining({
          name: "Atlas",
          model: "kimi-k2.5",
          focusAreas: ["email", "research"],
        }),
      },
    })
  })

  it("pings the webhook with agent payload", async () => {
    const { POST } = await import("@/app/api/agents/create/route")
    await POST(makeRequest(validPayload))
    expect(mockFetch).toHaveBeenCalledWith(
      "https://hooks.example.com/birdbot",
      expect.objectContaining({ method: "POST" })
    )
  })

  it("returns ok:true on success", async () => {
    const { POST } = await import("@/app/api/agents/create/route")
    const res = await POST(makeRequest(validPayload))
    const body = await res.json()
    expect(body).toEqual({ ok: true })
  })
})
