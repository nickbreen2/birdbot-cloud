import Anthropic from "@anthropic-ai/sdk"
import { followUpTask } from "@/trigger/followUp"

const anthropic = new Anthropic()

export function computeFollowUpTime(eventTime: Date): Date {
  if (eventTime.getHours() >= 20) {
    const nextMorning = new Date(eventTime)
    nextMorning.setDate(nextMorning.getDate() + 1)
    nextMorning.setHours(9, 0, 0, 0)
    return nextMorning
  }
  return new Date(eventTime.getTime() + 3 * 60 * 60 * 1000)
}

export function buildFollowUpIdempotencyKey(
  userId: string,
  entityName: string,
  eventDate: Date
): string {
  const year = eventDate.getFullYear()
  const month = String(eventDate.getMonth() + 1).padStart(2, "0")
  const day = String(eventDate.getDate()).padStart(2, "0")
  const dateStr = `${year}-${month}-${day}`
  const slug = entityName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
  return `followup-${userId}-${slug}-${dateStr}`
}

type DetectionResult =
  | { hasFollowUp: false }
  | { hasFollowUp: true; entityName: string; entityType: string; eventDate: string }

async function detectTemporalMarker(
  text: string,
  entities: { name: string; type: string }[],
  nowIso: string
): Promise<DetectionResult> {
  const entityList = entities.map((e) => `${e.name} (${e.type})`).join(", ")

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 100,
    system: `You detect future time references in messages. Current datetime: ${nowIso}.
Return only valid JSON in one of these two shapes:
{"hasFollowUp":false}
{"hasFollowUp":true,"entityName":"...","entityType":"...","eventDate":"ISO8601 datetime"}
Only set hasFollowUp to true if the message contains a clear future time reference (tomorrow, next week, a specific day, a specific date). The entityName must be one of the extracted entities. If uncertain, return {"hasFollowUp":false}.`,
    messages: [
      {
        role: "user",
        content: `Message: "${text}"\nExtracted entities: ${entityList}`,
      },
    ],
  })

  const raw = response.content[0]?.type === "text" ? response.content[0].text : "{}"
  try {
    return JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? "{}") as DetectionResult
  } catch {
    return { hasFollowUp: false }
  }
}

export async function detectAndScheduleFollowUp(
  userId: string,
  chatId: number,
  text: string,
  entities: { name: string; type: string }[]
): Promise<void> {
  try {
    const result = await detectTemporalMarker(text, entities, new Date().toISOString())
    if (!result.hasFollowUp) return

    const eventDate = new Date(result.eventDate)
    if (isNaN(eventDate.getTime()) || eventDate <= new Date()) return

    const followUpAt = computeFollowUpTime(eventDate)
    const idempotencyKey = buildFollowUpIdempotencyKey(userId, result.entityName, eventDate)

    await followUpTask.trigger(
      {
        userId,
        chatId,
        entityName: result.entityName,
        entityType: result.entityType,
        followUpAt: followUpAt.toISOString(),
      },
      { idempotencyKey }
    )
  } catch (err) {
    console.error("[followUpScheduler] failed to schedule follow-up:", err)
  }
}
