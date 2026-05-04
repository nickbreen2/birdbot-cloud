import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const dismissed = (user.privateMetadata?.dismissedLoops as string[] | undefined) ?? []

  if (!dismissed.includes(id)) {
    await client.users.updateUserMetadata(userId, {
      privateMetadata: { dismissedLoops: [...dismissed, id] },
    })
  }

  return NextResponse.json({ ok: true })
}
