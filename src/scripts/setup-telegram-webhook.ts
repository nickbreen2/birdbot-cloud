/**
 * One-time script: registers the Telegram webhook URL with Telegram's servers.
 * Run this once after each deploy to a new URL.
 *
 * Usage:
 *   cd birdbot-cloud
 *   APP_URL=https://your-vercel-url.vercel.app npx tsx src/scripts/setup-telegram-webhook.ts
 *
 * Or set NEXT_PUBLIC_APP_URL in .env.local (used as fallback).
 */
import { config } from "dotenv"
config({ path: ".env.local" })

const token = process.env.TELEGRAM_BOT_TOKEN
const secret = process.env.TELEGRAM_WEBHOOK_SECRET
const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL

if (!token) { console.error("Missing TELEGRAM_BOT_TOKEN"); process.exit(1) }
if (!secret) { console.error("Missing TELEGRAM_WEBHOOK_SECRET"); process.exit(1) }
if (!appUrl || appUrl.includes("localhost")) {
  console.error("APP_URL must be a public HTTPS URL, got:", appUrl)
  process.exit(1)
}

const webhookUrl = `${appUrl}/api/telegram/webhook`

async function main() {
  console.log("Setting webhook to:", webhookUrl)

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secret,
      allowed_updates: ["message"],
    }),
  })

  const data = await res.json()
  if (data.ok) {
    console.log("Webhook registered successfully.")
  } else {
    console.error("Failed to register webhook:", JSON.stringify(data, null, 2))
    process.exit(1)
  }

  const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)
  const info = await infoRes.json()
  console.log("Webhook info:", JSON.stringify(info.result, null, 2))
}

main().catch((err) => { console.error(err); process.exit(1) })
