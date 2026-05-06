import { google } from "googleapis"
import { getGoogleClient } from "@/lib/google"

export type EmailSummary = {
  id: string
  threadId: string
  subject: string
  from: string
  snippet: string
}

export type SendEmailDetails = {
  to: string
  subject: string
  body: string
}

export async function getUnreadSummary(userId: string, maxResults = 10): Promise<EmailSummary[]> {
  const auth = await getGoogleClient(userId)
  const gmail = google.gmail({ version: "v1", auth: auth as never })

  const list = await gmail.users.messages.list({
    userId: "me",
    q: "is:unread",
    maxResults,
  })

  if (!list.data.messages?.length) return []

  const messages = await Promise.all(
    list.data.messages.map((m) =>
      gmail.users.messages.get({
        userId: "me",
        id: m.id!,
        format: "metadata",
        metadataHeaders: ["Subject", "From"],
      })
    )
  )

  return messages.map((r) => {
    const headers = r.data.payload?.headers ?? []
    return {
      id: r.data.id ?? "",
      threadId: r.data.threadId ?? "",
      subject: headers.find((h) => h.name === "Subject")?.value ?? "(no subject)",
      from: headers.find((h) => h.name === "From")?.value ?? "",
      snippet: r.data.snippet ?? "",
    }
  })
}

export async function getThread(userId: string, threadId: string): Promise<string> {
  const auth = await getGoogleClient(userId)
  const gmail = google.gmail({ version: "v1", auth: auth as never })

  const thread = await gmail.users.threads.get({ userId: "me", id: threadId })
  return thread.data.messages?.map((m) => m.snippet ?? "").join("\n---\n") ?? ""
}

export async function draftEmail(userId: string, details: SendEmailDetails): Promise<string> {
  const auth = await getGoogleClient(userId)
  const gmail = google.gmail({ version: "v1", auth: auth as never })

  const raw = Buffer.from(
    [`To: ${details.to}`, `Subject: ${details.subject}`, "", details.body].join("\n")
  ).toString("base64url")

  const draft = await gmail.users.drafts.create({
    userId: "me",
    requestBody: { message: { raw } },
  })

  return draft.data.id ?? ""
}

export async function sendEmail(userId: string, details: SendEmailDetails): Promise<void> {
  const auth = await getGoogleClient(userId)
  const gmail = google.gmail({ version: "v1", auth: auth as never })

  const raw = Buffer.from(
    [`To: ${details.to}`, `Subject: ${details.subject}`, "", details.body].join("\n")
  ).toString("base64url")

  await gmail.users.messages.send({ userId: "me", requestBody: { raw } })
}
