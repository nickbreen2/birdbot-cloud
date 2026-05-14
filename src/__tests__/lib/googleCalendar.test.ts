import { describe, it, expect, vi, beforeEach } from "vitest"

const mocks = vi.hoisted(() => ({
  getGoogleClient: vi.fn(),
  calendarEventsList: vi.fn(),
  calendarEventsInsert: vi.fn(),
  setCredentials: vi.fn(),
}))

vi.mock("@/lib/google", () => ({ getGoogleClient: mocks.getGoogleClient }))

vi.mock("googleapis", () => ({
  google: {
    calendar: vi.fn().mockReturnValue({
      events: {
        list: mocks.calendarEventsList,
        insert: mocks.calendarEventsInsert,
      },
    }),
  },
}))

mocks.getGoogleClient.mockResolvedValue({ setCredentials: mocks.setCredentials })

import { getUpcomingEvents, createEvent } from "@/lib/googleCalendar"

describe("getUpcomingEvents", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns formatted events", async () => {
    mocks.calendarEventsList.mockResolvedValue({
      data: {
        items: [
          {
            id: "evt1",
            summary: "Standup",
            start: { dateTime: "2026-05-07T09:00:00Z" },
            end: { dateTime: "2026-05-07T09:30:00Z" },
          },
        ],
      },
    })

    const events = await getUpcomingEvents("user_1")
    expect(events).toHaveLength(1)
    expect(events[0].title).toBe("Standup")
    expect(events[0].id).toBe("evt1")
  })

  it("returns empty array when no events", async () => {
    mocks.calendarEventsList.mockResolvedValue({ data: { items: [] } })
    const events = await getUpcomingEvents("user_1")
    expect(events).toHaveLength(0)
  })
})

describe("createEvent", () => {
  it("calls events.insert and returns the event id", async () => {
    mocks.calendarEventsInsert.mockResolvedValue({ data: { id: "new_evt_1" } })

    const id = await createEvent("user_1", {
      title: "Team sync",
      start: "2026-05-08T14:00:00Z",
      end: "2026-05-08T15:00:00Z",
    })

    expect(id).toBe("new_evt_1")
    expect(mocks.calendarEventsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        requestBody: expect.objectContaining({ summary: "Team sync" }),
      })
    )
  })
})
