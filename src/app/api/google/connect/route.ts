import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { buildOAuthClient, createState } from "@/lib/google"

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/userinfo.email",
]

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/sign-in`)

  const client = buildOAuthClient()
  const state = createState(userId)
  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state,
    prompt: "consent",
  })

  return NextResponse.redirect(url)
}
