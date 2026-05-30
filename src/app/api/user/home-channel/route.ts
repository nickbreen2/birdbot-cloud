import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const prefs = await prisma.userPreferences.findUnique({
      where: { userId },
      select: { homeChannel: true },
    })
    return NextResponse.json({ homeChannel: prefs?.homeChannel ?? null })
  } catch (err) {
    console.error("[/api/user/home-channel GET] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { homeChannel: "telegram" | "whatsapp" }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  // null homeChannel is set server-side only (on unpair), not via this endpoint
  if (body.homeChannel !== "telegram" && body.homeChannel !== "whatsapp") {
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 })
  }

  try {
    await prisma.userPreferences.upsert({
      where: { userId },
      create: { userId, homeChannel: body.homeChannel },
      update: { homeChannel: body.homeChannel },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[/api/user/home-channel PATCH] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
