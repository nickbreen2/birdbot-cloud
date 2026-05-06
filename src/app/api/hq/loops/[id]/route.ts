import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"

type RouteContext = { params: Promise<{ id: string }> }

async function getClient(userId: string) {
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const dismissed = (user.privateMetadata?.dismissedLoops as string[] | undefined) ?? []
  return { client, dismissed }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { client, dismissed } = await getClient(userId)

  if (!dismissed.includes(id)) {
    await client.users.updateUserMetadata(userId, {
      privateMetadata: { dismissedLoops: [...dismissed, id] },
    })
  }

  return NextResponse.json({ ok: true })
}

export async function POST(_req: Request, { params }: RouteContext) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { client, dismissed } = await getClient(userId)

  await client.users.updateUserMetadata(userId, {
    privateMetadata: { dismissedLoops: dismissed.filter((d) => d !== id) },
  })

  return NextResponse.json({ ok: true })
}
