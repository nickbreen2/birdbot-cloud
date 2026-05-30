const GRAPH_API = "https://graph.facebook.com/v21.0"

export async function sendWhatsAppMessage(phoneNumber: string, text: string): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  if (!phoneNumberId || !token) throw new Error("WhatsApp env vars not set")

  const res = await fetch(`${GRAPH_API}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phoneNumber.replace("+", ""),
      type: "text",
      text: { body: text },
    }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => "(unable to read response)")
    console.error("[whatsapp] sendMessage failed:", res.status, err)
  }
}

// Only supports parameterless templates. If a template needs body variables, extend the signature.
export async function sendWhatsAppTemplate(phoneNumber: string, templateName: string): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  if (!phoneNumberId || !token) throw new Error("WhatsApp env vars not set")

  const res = await fetch(`${GRAPH_API}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phoneNumber.replace("+", ""),
      type: "template",
      template: {
        name: templateName,
        language: { code: "en" },
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => "(unable to read response)")
    console.error("[whatsapp] sendTemplate failed:", res.status, err)
  }
}
