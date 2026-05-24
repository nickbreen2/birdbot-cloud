// Stub — full implementation in Task 6
import { task } from "@trigger.dev/sdk"

type WhatsAppProcessPayload =
  | { phoneNumber: string; text: string; userId: string; pairingUserId?: never; pairingToken?: never }
  | { phoneNumber: string; text: string; pairingUserId: string; pairingToken: string; userId?: never }

export const whatsappProcess = task({
  id: "whatsapp-process",
  run: async (_payload: WhatsAppProcessPayload) => {},
})
