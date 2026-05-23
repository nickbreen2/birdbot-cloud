import { describe, it, expect, vi } from "vitest"

vi.mock("@/trigger/followUp", () => ({
  followUpTask: { trigger: vi.fn() },
}))

import { computeFollowUpTime, buildFollowUpIdempotencyKey } from "@/lib/followUpScheduler"

describe("computeFollowUpTime", () => {
  it("event at 2pm returns 5pm same day", () => {
    const event = new Date(2026, 4, 22, 14, 0, 0)
    const result = computeFollowUpTime(event)
    expect(result.getDate()).toBe(22)
    expect(result.getHours()).toBe(17)
    expect(result.getMinutes()).toBe(0)
  })

  it("event at exactly 8pm returns 9am next morning", () => {
    const event = new Date(2026, 4, 22, 20, 0, 0)
    const result = computeFollowUpTime(event)
    expect(result.getDate()).toBe(23)
    expect(result.getHours()).toBe(9)
    expect(result.getMinutes()).toBe(0)
  })

  it("event at 9pm returns 9am next morning", () => {
    const event = new Date(2026, 4, 22, 21, 0, 0)
    const result = computeFollowUpTime(event)
    expect(result.getDate()).toBe(23)
    expect(result.getHours()).toBe(9)
    expect(result.getMinutes()).toBe(0)
  })

  it("event at 7:59pm returns 3 hours later same day", () => {
    const event = new Date(2026, 4, 22, 19, 59, 0)
    const result = computeFollowUpTime(event)
    expect(result.getDate()).toBe(22)
    expect(result.getHours()).toBe(22)
    expect(result.getMinutes()).toBe(59)
  })
})

describe("buildFollowUpIdempotencyKey", () => {
  it("produces a stable key for same inputs", () => {
    const date = new Date(2026, 4, 22, 14, 0, 0)
    const key1 = buildFollowUpIdempotencyKey("user123", "investor call", date)
    const key2 = buildFollowUpIdempotencyKey("user123", "investor call", date)
    expect(key1).toBe(key2)
  })

  it("includes userId, slugified entity name, and date", () => {
    const date = new Date(2026, 4, 22, 14, 0, 0)
    const key = buildFollowUpIdempotencyKey("user_abc", "Investor Call", date)
    expect(key).toContain("user_abc")
    expect(key).toContain("investor-call")
    expect(key).toMatch(/2026-05-22/)
  })

  it("different entity names produce different keys", () => {
    const date = new Date(2026, 4, 22, 14, 0, 0)
    const key1 = buildFollowUpIdempotencyKey("user123", "investor call", date)
    const key2 = buildFollowUpIdempotencyKey("user123", "team standup", date)
    expect(key1).not.toBe(key2)
  })

  it("different dates produce different keys", () => {
    const key1 = buildFollowUpIdempotencyKey("user123", "call", new Date(2026, 4, 22, 14, 0, 0))
    const key2 = buildFollowUpIdempotencyKey("user123", "call", new Date(2026, 4, 23, 14, 0, 0))
    expect(key1).not.toBe(key2)
  })
})
