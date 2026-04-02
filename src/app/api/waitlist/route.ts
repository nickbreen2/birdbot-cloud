import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }

    await prisma.waitlistEntry.upsert({
      where: { email },
      update: {}, // already subscribed — do nothing
      create: { email },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[/api/waitlist] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
