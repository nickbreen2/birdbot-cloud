import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let connection = await prisma.mcpConnection.findUnique({
      where: { clerkUserId: userId },
    })

    if (!connection) {
      connection = await prisma.mcpConnection.create({
        data: {
          clerkUserId: userId,
          userToken: crypto.randomUUID(),
        },
      })
    }

    return NextResponse.json({
      token: connection.userToken,
      lastSeenAt: connection.lastSeenAt,
    })
  } catch (err) {
    console.error("[/api/connection/token] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
