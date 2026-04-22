import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ project: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { project: encodedProject } = await params
    const oldName = decodeURIComponent(encodedProject)

    const body = await request.json() as { name?: string }
    const newName = body.name?.trim()
    if (!newName) return NextResponse.json({ error: "name required" }, { status: 400 })
    if (newName === oldName) return NextResponse.json({ ok: true })

    const connection = await prisma.mcpConnection.findUnique({ where: { clerkUserId: userId } })
    if (!connection) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const { userToken } = connection

    await prisma.$transaction([
      prisma.cloudProject.updateMany({ where: { userToken, name: oldName }, data: { name: newName } }),
      prisma.cloudSession.updateMany({ where: { userToken, project: oldName }, data: { project: newName } }),
      prisma.cloudDecision.updateMany({ where: { userToken, project: oldName }, data: { project: newName } }),
    ])

    await prisma.projectBrief.updateMany({
      where: { userToken, project: oldName },
      data: { project: newName },
    }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[PATCH /api/projects/[project]] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ project: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { project } = await params

    const connection = await prisma.mcpConnection.findUnique({
      where: { clerkUserId: userId },
    })

    if (!connection) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const { userToken } = connection

    await Promise.all([
      prisma.cloudProject.deleteMany({ where: { userToken, name: project } }),
      prisma.cloudSession.deleteMany({ where: { userToken, project } }),
      prisma.cloudDecision.deleteMany({ where: { userToken, project } }),
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[DELETE /api/projects/[project]] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
