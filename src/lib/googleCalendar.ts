import { google } from "googleapis"
import { getGoogleClient } from "@/lib/google"

export type CalendarEvent = {
  id: string
  title: string
  start: string
  end: string
  description?: string
  attendees?: string[]
}

export type CreateEventDetails = {
  title: string
  start: string
  end: string
  description?: string
  attendees?: string[]
}

export async function getUpcomingEvents(userId: string, days = 7): Promise<CalendarEvent[]> {
  const auth = await getGoogleClient(userId)
  const calendar = google.calendar({ version: "v3", auth: auth as never })

  const now = new Date()
  const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: now.toISOString(),
    timeMax: until.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 50,
  })

  return (response.data.items ?? []).map((e) => ({
    id: e.id ?? "",
    title: e.summary ?? "(no title)",
    start: e.start?.dateTime ?? e.start?.date ?? "",
    end: e.end?.dateTime ?? e.end?.date ?? "",
    description: e.description ?? undefined,
    attendees: e.attendees?.map((a) => a.email ?? "").filter(Boolean),
  }))
}

export async function createEvent(userId: string, details: CreateEventDetails): Promise<string> {
  const auth = await getGoogleClient(userId)
  const calendar = google.calendar({ version: "v3", auth: auth as never })

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: details.title,
      start: { dateTime: details.start },
      end: { dateTime: details.end },
      description: details.description,
      attendees: details.attendees?.map((email) => ({ email })),
    },
  })

  return response.data.id ?? ""
}
