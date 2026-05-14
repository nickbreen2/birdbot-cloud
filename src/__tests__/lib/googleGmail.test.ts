import { describe, it, expect, vi, beforeEach } from "vitest"

const mocks = vi.hoisted(() => ({
  getGoogleClient: vi.fn(),
  draftsCreate: vi.fn(),
  messagesSend: vi.fn(),
  setCredentials: vi.fn(),
}))

vi.mock("@/lib/google", () => ({ getGoogleClient: mocks.getGoogleClient }))

vi.mock("googleapis", () => ({
  google: {
    gmail: vi.fn().mockReturnValue({
      users: {
        drafts: {
          create: mocks.draftsCreate,
        },
        messages: {
          send: mocks.messagesSend,
        },
      },
    }),
  },
}))

mocks.getGoogleClient.mockResolvedValue({ setCredentials: mocks.setCredentials })

import { draftEmail, sendEmail } from "@/lib/googleGmail"

describe("draftEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.draftsCreate.mockResolvedValue({ data: { id: "draft_1" } })
  })

  it("strips newlines from to field", async () => {
    await draftEmail("user_1", {
      to: "victim@x.com\nBcc: attacker@evil.com",
      subject: "Hello",
      body: "Test body",
    })

    const rawB64 = mocks.draftsCreate.mock.calls[0][0].requestBody.message.raw
    const decoded = Buffer.from(rawB64, "base64url").toString("utf8")
    // The injected value must not appear as a standalone header line
    expect(decoded).not.toMatch(/^Bcc:/m)
  })

  it("strips newlines from subject field", async () => {
    await draftEmail("user_1", {
      to: "test@example.com",
      subject: "Hello\r\nX-Injected: evil",
      body: "Test body",
    })

    const rawB64 = mocks.draftsCreate.mock.calls[0][0].requestBody.message.raw
    const decoded = Buffer.from(rawB64, "base64url").toString("utf8")
    // The injected header must not appear as a standalone header line
    expect(decoded).not.toMatch(/^X-Injected:/m)
  })
})

describe("sendEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.messagesSend.mockResolvedValue({ data: {} })
  })

  it("strips newlines from to field", async () => {
    await sendEmail("user_1", {
      to: "victim@x.com\nBcc: attacker@evil.com",
      subject: "Hello",
      body: "Test body",
    })

    const rawB64 = mocks.messagesSend.mock.calls[0][0].requestBody.raw
    const decoded = Buffer.from(rawB64, "base64url").toString("utf8")
    // The injected value must not appear as a standalone header line
    expect(decoded).not.toMatch(/^Bcc:/m)
  })
})
