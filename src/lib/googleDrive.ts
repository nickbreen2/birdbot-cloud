import { google } from "googleapis"
import { getGoogleClient } from "@/lib/google"

export type DriveFile = {
  id: string
  name: string
  mimeType: string
  webViewLink?: string
}

export async function searchFiles(userId: string, query: string): Promise<DriveFile[]> {
  const auth = await getGoogleClient(userId)
  const drive = google.drive({ version: "v3", auth: auth as never })

  const safeQuery = query.replace(/'/g, "\\'")
  const response = await drive.files.list({
    q: `name contains '${safeQuery}' and trashed = false`,
    fields: "files(id, name, mimeType, webViewLink)",
    pageSize: 10,
  })

  return (response.data.files ?? []).map((f) => ({
    id: f.id ?? "",
    name: f.name ?? "",
    mimeType: f.mimeType ?? "",
    webViewLink: f.webViewLink ?? undefined,
  }))
}

export async function getFile(
  userId: string,
  fileId: string
): Promise<{ metadata: DriveFile; content: string }> {
  const auth = await getGoogleClient(userId)
  const drive = google.drive({ version: "v3", auth: auth as never })

  const meta = await drive.files.get({ fileId, fields: "id, name, mimeType, webViewLink" })

  let content = ""
  if (meta.data.mimeType?.startsWith("application/vnd.google-apps")) {
    try {
      const res = await drive.files.export({ fileId, mimeType: "text/plain" }, { responseType: "text" })
      content = String(res.data)
    } catch {
      // Not all Google file types can be exported as text
    }
  }

  return {
    metadata: {
      id: meta.data.id ?? "",
      name: meta.data.name ?? "",
      mimeType: meta.data.mimeType ?? "",
      webViewLink: meta.data.webViewLink ?? undefined,
    },
    content,
  }
}

export async function createDoc(userId: string, title: string, content: string): Promise<string> {
  const auth = await getGoogleClient(userId)
  const drive = google.drive({ version: "v3", auth: auth as never })

  const response = await drive.files.create({
    requestBody: { name: title, mimeType: "application/vnd.google-apps.document" },
    media: { mimeType: "text/plain", body: content },
    fields: "id",
  })

  if (!response.data.id) throw new Error("Drive file creation returned no id")
  return response.data.id
}
