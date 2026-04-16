import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { deprovisionAgent } from "@/lib/deprovisionAgent"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id: agentId } = await params
    await deprovisionAgent(agentId, userId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[DELETE /api/provision/[id]] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    if (message === "Agent not found") return NextResponse.json({ error: message }, { status: 404 })
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
