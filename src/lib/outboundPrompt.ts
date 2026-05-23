import Anthropic from "@anthropic-ai/sdk"
import { GraphContext } from "@/lib/graphContext"

const anthropic = new Anthropic()

export type OutboundMode = "daily_brief" | "follow_up"

export interface OutboundContext extends GraphContext {
  mode: OutboundMode
  calendarEvents?: { title: string; start: string }[]
  unreadEmails?: { subject: string; from: string }[]
  followUpEntity?: { name: string; type: string; description?: string }
}

const MAX_OUTBOUND_CHARS = 300

export const OUTBOUND_SYSTEM_PROMPT = `You are Bird, a personal AI assistant for founders and busy professionals. You are reaching out proactively. The user did not text you first. Keep your message to one to three sentences.

DAILY BRIEF MODE
Open casually: "Morning." or "Hey." Never "Good morning!" or "Hope you're having a great day!"
If calendar events are provided, mention them naturally before asking about the agenda.
If unread emails are provided, briefly mention them.
Then ask what else is on the agenda for today.
If graph context is available, surface one specific relevant thing: an active goal, something in motion, a recent entity worth following up on. Reference it specifically.

FOLLOW-UP MODE
You remembered something the user mentioned was coming up. It has now passed. Check in on it directly.
Format: "Hey, how did [thing] go?" or "How'd [thing] turn out?" One sentence. Nothing else.

RULES
No em dashes anywhere in your reply.
No sycophancy: "Hope you're crushing it!", "How's everything going?", "Just checking in!" are all banned.
No chatbot tics: "Let me know if you need anything!" is banned.
Use the user's own words when referencing their entities.
Every word earns its place.

OUTPUT
Return only the message text. No JSON, no preamble, no explanation.`

export function buildOutboundUserMessage(context: OutboundContext): string {
  const recentContext =
    context.recentEntities.length > 0
      ? context.recentEntities
          .slice(0, 5)
          .map((e) => `${e.name} (${e.type})${e.description ? ` - ${e.description}` : ""}`)
          .join(", ")
      : "none"

  const activeGoalList =
    context.activeGoals.length > 0
      ? context.activeGoals
          .map((g) => g.name + (g.description ? ` - ${g.description}` : ""))
          .join("; ")
      : "none"

  const lines: string[] = [
    `Mode: ${context.mode}`,
    `Recent context: ${recentContext}`,
    `Active goals: ${activeGoalList}`,
  ]

  if (context.mode === "daily_brief") {
    if (context.calendarEvents && context.calendarEvents.length > 0) {
      const events = context.calendarEvents
        .map((e) => {
          const time = new Date(e.start).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
          return `${e.title} at ${time}`
        })
        .join(", ")
      lines.push(`Calendar today: ${events}`)
    }

    if (context.unreadEmails && context.unreadEmails.length > 0) {
      const emails = context.unreadEmails
        .map((e) => `${e.subject} from ${e.from.split("<")[0].trim()}`)
        .join(", ")
      lines.push(`Unread emails (${context.unreadEmails.length}): ${emails}`)
    }
  }

  if (context.mode === "follow_up" && context.followUpEntity) {
    lines.push(
      `Follow-up subject: ${context.followUpEntity.name} (${context.followUpEntity.type})${
        context.followUpEntity.description ? ` - ${context.followUpEntity.description}` : ""
      }`
    )
  }

  return lines.join("\n")
}

export async function generateDailyBrief(
  context: OutboundContext,
  fallback: string
): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      system: OUTBOUND_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildOutboundUserMessage(context) }],
    })

    const raw = response.content[0]?.type === "text" ? response.content[0].text : ""
    const reply = raw.replace(/\n+/g, " ").trim()

    if (!reply || reply.length > MAX_OUTBOUND_CHARS) return fallback
    return reply
  } catch {
    return fallback
  }
}
