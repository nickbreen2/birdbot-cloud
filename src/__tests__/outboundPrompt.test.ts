import { describe, it, expect } from "vitest"
import { buildOutboundUserMessage, OutboundContext } from "@/lib/outboundPrompt"

const baseContext: OutboundContext = {
  mode: "daily_brief",
  recentEntities: [],
  activeGoals: [],
  softGoals: [],
}

describe("buildOutboundUserMessage", () => {
  it("daily_brief with no context produces minimal message", () => {
    const result = buildOutboundUserMessage(baseContext)
    expect(result).toContain("Mode: daily_brief")
    expect(result).toContain("Recent context: none")
    expect(result).toContain("Active goals: none")
    expect(result).not.toContain("Calendar today:")
    expect(result).not.toContain("Unread emails")
  })

  it("daily_brief includes calendar events when provided", () => {
    const context: OutboundContext = {
      ...baseContext,
      calendarEvents: [{ title: "Investor call", start: "2026-05-22T14:00:00.000Z" }],
    }
    const result = buildOutboundUserMessage(context)
    expect(result).toContain("Calendar today:")
    expect(result).toContain("Investor call")
  })

  it("daily_brief includes unread emails when provided", () => {
    const context: OutboundContext = {
      ...baseContext,
      unreadEmails: [{ subject: "Re: Contract", from: "Sarah Smith <sarah@example.com>" }],
    }
    const result = buildOutboundUserMessage(context)
    expect(result).toContain("Unread emails (1): Re: Contract from Sarah Smith")
  })

  it("daily_brief includes recent entities in context", () => {
    const context: OutboundContext = {
      ...baseContext,
      recentEntities: [{ name: "BirdBot launch", type: "project", description: "on track for Friday" }],
    }
    const result = buildOutboundUserMessage(context)
    expect(result).toContain("BirdBot launch (project)")
    expect(result).toContain("on track for Friday")
  })

  it("follow_up includes follow-up entity", () => {
    const context: OutboundContext = {
      ...baseContext,
      mode: "follow_up",
      followUpEntity: { name: "investor call", type: "event" },
    }
    const result = buildOutboundUserMessage(context)
    expect(result).toContain("Mode: follow_up")
    expect(result).toContain("Follow-up subject: investor call (event)")
  })

  it("follow_up omits calendar and email sections even if provided", () => {
    const context: OutboundContext = {
      ...baseContext,
      mode: "follow_up",
      followUpEntity: { name: "investor call", type: "event" },
      calendarEvents: [{ title: "Some event", start: "2026-05-22T14:00:00.000Z" }],
    }
    const result = buildOutboundUserMessage(context)
    expect(result).not.toContain("Calendar today:")
  })

  it("limits recent entities to 5", () => {
    const context: OutboundContext = {
      ...baseContext,
      recentEntities: Array.from({ length: 8 }, (_, i) => ({ name: `Entity ${i}`, type: "task" })),
    }
    const result = buildOutboundUserMessage(context)
    expect(result).toContain("Entity 0")
    expect(result).not.toContain("Entity 5")
  })
})
