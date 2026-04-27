import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const { token } = (await request.json()) as { token?: string }

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "token required" }, { status: 400 })
    }

    const connection = await prisma.mcpConnection.findUnique({
      where: { userToken: token },
    })

    if (!connection) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.mcpConnection.update({
      where: { userToken: token },
      data: { lastSeenAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[/api/mcp/ping] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
