import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"
import { clerkClient } from "@clerk/nextjs/server"
import { buildOAuthClient, verifyState } from "@/lib/google"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const errorBase = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?google=error`

  if (!code || !state) return NextResponse.redirect(errorBase)

  const userId = verifyState(state)
  if (!userId) return NextResponse.redirect(errorBase)

  const client = buildOAuthClient()

  let tokens: {
    access_token?: string | null
    refresh_token?: string | null
    expiry_date?: number | null
    scope?: string | null
  }
  try {
    const result = await client.getToken(code)
    tokens = result.tokens
  } catch {
    return NextResponse.redirect(errorBase)
  }

  if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
    return NextResponse.redirect(errorBase)
  }

  client.setCredentials(tokens)
  let email = ""
  try {
    const oauth2 = google.oauth2({ version: "v2", auth: client as never })
    const { data } = await oauth2.userinfo.get()
    email = data.email ?? ""
  } catch {
    return NextResponse.redirect(errorBase)
  }

  await prisma.googleConnection.upsert({
    where: { userId },
    create: {
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date),
      scopes: (tokens.scope ?? "").split(" ").filter(Boolean),
      email,
    },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date),
      scopes: (tokens.scope ?? "").split(" ").filter(Boolean),
      email,
    },
  })

  // Update Clerk metadata and redirect based on onboarding state
  const clerk = await clerkClient()
  const clerkUser = await clerk.users.getUser(userId)
  const meta = clerkUser.publicMetadata as Record<string, unknown>

  await clerk.users.updateUser(userId, {
    publicMetadata: { ...meta, googleConnected: true },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const dest = meta.onboardingComplete === false
    ? `${appUrl}/onboarding/plan?google=connected`
    : `${appUrl}/dashboard/integrations?google=connected`

  return NextResponse.redirect(dest)
}
