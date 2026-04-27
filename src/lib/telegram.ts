export type TelegramUpdate = {
  update_id: number
  message?: TelegramMessage
}

export type TelegramMessage = {
  message_id: number
  from?: TelegramFrom
  chat: TelegramChat
  text?: string
}

export type TelegramFrom = {
  id: number
  first_name?: string
  last_name?: string
  username?: string
}

export type TelegramChat = {
  id: number
}

export async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN not set")

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error("[telegram] sendMessage failed:", res.status, body)
  }
}
