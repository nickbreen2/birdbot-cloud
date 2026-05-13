import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { buildOAuthClient } from "@/lib/google"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/tokenEncryption"

export async function DELETE() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const conn = await prisma.googleConnection.findUnique({ where: { userId } })
  if (!conn) return NextResponse.json({ disconnected: true })

  const client = buildOAuthClient()
  try {
    await client.revokeToken(decrypt(conn.accessToken))
  } catch {
    // Ignore revocation errors — still delete locally
  }

  await prisma.googleConnection.delete({ where: { userId } })
  return NextResponse.json({ disconnected: true })
}
