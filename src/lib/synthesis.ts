import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

const MODEL = process.env.BIRDBOT_MODEL ?? "claude-sonnet-4-6"

interface Session {
  summary: string
  created_at: string
}

interface Decision {
  decision: string
  reasoning: string | null
  created_at: string
}

export async function synthesizeBriefing(
  sessions: Session[],
  decisions: Decision[],
  project: string
): Promise<string> {
  if (sessions.length === 0 && decisions.length === 0) {
    return `No history yet for project "${project}". This is the first session — start building and log decisions as you go.`
  }

  const sessionsText = sessions
    .map(s => `[${s.created_at}] ${s.summary}`)
    .join("\n")

  const decisionsText = decisions
    .map(d => `[${d.created_at}] ${d.decision}${d.reasoning ? ` — ${d.reasoning}` : ""}`)
    .join("\n")

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: `You are BirdBot, a project memory layer for vibe coders. Synthesize project history into a sharp, useful briefing for an AI coding assistant starting a new session.

Rules:
- 3-5 sentences maximum. No headers, no bullet points — one paragraph.
- Be opinionated: flag contradictions, surface relevant pitfalls, connect patterns the developer might not have noticed.
- End with the single most important open item or next step if one is clear.
- Write like a technical collaborator handing off to a colleague, not a scribe reciting notes.`,
    messages: [
      {
        role: "user",
        content: `Project: ${project}

Recent sessions (newest first):
${sessionsText || "None yet."}

Architectural decisions:
${decisionsText || "None logged yet."}

Generate the session briefing.`,
      },
    ],
  })

  const textBlock = response.content.find(b => b.type === "text")
  return textBlock?.text ?? ""
}
