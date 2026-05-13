import { timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"
import { tasks } from "@trigger.dev/sdk"
import type { telegramProcess } from "@/trigger/telegram"
import type { TelegramUpdate } from "@/lib/telegram"

export async function POST(request: Request) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token")
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!secret || !expected || !timingSafeEqual(Buffer.from(secret), Buffer.from(expected))) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  let update: TelegramUpdate
  try {
    update = await request.json() as TelegramUpdate
  } catch {
    return new NextResponse("Bad Request", { status: 400 })
  }

  const msg = update.message
  if (!msg?.from || typeof msg.text !== "string") {
    return new NextResponse("OK", { status: 200 })
  }

  await tasks.trigger<typeof telegramProcess>("telegram-process", {
    telegramId: msg.from.id,
    chatId: msg.chat.id,
    messageId: msg.message_id,
    text: msg.text,
    firstName: msg.from.first_name,
    username: msg.from.username,
  })

  return new NextResponse("OK", { status: 200 })
}
