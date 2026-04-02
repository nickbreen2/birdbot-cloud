import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const agents = await prisma.agent.findMany({
      where: { clerkUserId: userId },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({
      agents,
      onboarded: agents.length > 0,
    })
  } catch (err) {
    console.error("[/api/agents] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
