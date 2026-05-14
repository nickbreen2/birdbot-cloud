import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"

const LIVE_PLATFORMS = new Set(["telegram"])

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json() as { platform?: string }
  const platform = body.platform

  if (!platform || !LIVE_PLATFORMS.has(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 })
  }

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  await client.users.updateUser(userId, {
    publicMetadata: {
      ...user.publicMetadata,
      platform,
      onboardingComplete: false,   // mark as in-progress so middleware guard activates
    },
  })

  return NextResponse.json({ ok: true })
}
