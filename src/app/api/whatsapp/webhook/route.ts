import { createHmac, timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"
import { tasks } from "@trigger.dev/sdk"
import { prisma } from "@/lib/prisma"
import type { whatsappProcess } from "@/trigger/whatsapp"

type WaEntry = {
  changes: Array<{
    value: {
      messages?: Array<{
        from: string
        type: string
        text?: { body: string }
      }>
    }
  }>
}

type WaWebhookPayload = {
  object: string
  entry: WaEntry[]
}

function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET
  if (!secret) return false
  const expected = createHmac("sha256", secret).update(payload).digest("hex")
  const sig = signature.replace("sha256=", "")
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(sig, "hex"))
  } catch {
    return false
  }
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const mode = url.searchParams.get("hub.mode")
  const token = url.searchParams.get("hub.verify_token")
  const challenge = url.searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 })
  }
  return new Response("Forbidden", { status: 403 })
}

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text()
  const signature = request.headers.get("x-hub-signature-256") ?? ""

  if (!verifySignature(rawBody, signature)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  let payload: WaWebhookPayload
  try {
    payload = JSON.parse(rawBody) as WaWebhookPayload
  } catch {
    return new NextResponse("Bad Request", { status: 400 })
  }

  const messages = payload.entry?.[0]?.changes?.[0]?.value?.messages
  if (!messages?.length) {
    return new NextResponse("OK", { status: 200 })
  }

  const msg = messages[0]
  if (msg.type !== "text" || !msg.text?.body) {
    return new NextResponse("OK", { status: 200 })
  }

  const from = msg.from
  const text = msg.text.body.trim()

  // Check if this message is a pairing code
  const pairingToken = await prisma.whatsAppPairingToken.findUnique({
    where: { token: text.toUpperCase() },
  })

  if (pairingToken && !pairingToken.usedAt && pairingToken.expiresAt > new Date()) {
    await tasks.trigger<typeof whatsappProcess>("whatsapp-process", {
      phoneNumber: from,
      text,
      pairingUserId: pairingToken.userId,
      pairingToken: pairingToken.token,
    })
    return new NextResponse("OK", { status: 200 })
  }

  // Check if this is a known user
  const waUser = await prisma.whatsAppUser.findUnique({ where: { phoneNumber: from } })
  if (!waUser) {
    return new NextResponse("OK", { status: 200 })
  }

  await tasks.trigger<typeof whatsappProcess>("whatsapp-process", {
    phoneNumber: from,
    text,
    userId: waUser.userId,
  })

  return new NextResponse("OK", { status: 200 })
}
