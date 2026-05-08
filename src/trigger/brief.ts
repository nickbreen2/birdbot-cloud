import { task } from "@trigger.dev/sdk"
import Anthropic from "@anthropic-ai/sdk"
import { prisma } from "@/lib/prisma"

const anthropic = new Anthropic()

function buildPrompt(project: string, sessions: { summary: string | null; createdAt: Date }[], decisions: { decision: string; reasoning: string | null; createdAt: Date }[]): string {
  const sessionLines = sessions
    .map(s => `- ${s.createdAt.toISOString().slice(0, 10)}: ${s.summary ?? "(no summary)"}`)
    .join("\n")

  const decisionLines = decisions
    .map(d => `- ${d.decision}${d.reasoning ? ` — ${d.reasoning}` : ""}`)
    .join("\n")

  return `You are analyzing a software project called "${project}".

SESSION HISTORY (most recent first):
${sessionLines || "(none yet)"}

ARCHITECTURAL DECISIONS:
${decisionLines || "(none yet)"}

Write a concise project brief (under 500 words) covering:
1. What this project is and what it does
2. Tech stack and architecture based on what you can infer
3. Key decisions made and why
4. Current state — what was most recently worked on
5. Any open questions or blockers mentioned

Be factual and specific. Only include information you can infer from the sessions and decisions above. If there is very little data, write a short brief with what you know.`
}

export const regenerateProjectBrief = task({
  id: "regenerate-project-brief",
  retry: { maxAttempts: 3 },
  run: async (payload: { userToken: string; project: string }) => {
    const [sessions, decisions] = await Promise.all([
      prisma.cloudSession.findMany({
        where: { userToken: payload.userToken, project: payload.project },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { summary: true, createdAt: true },
      }),
      prisma.cloudDecision.findMany({
        where: { userToken: payload.userToken, project: payload.project },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: { decision: true, reasoning: true, createdAt: true },
      }),
    ])

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: buildPrompt(payload.project, sessions, decisions) }],
    })

    const brief = response.content[0].type === "text" ? response.content[0].text : ""

    await prisma.projectBrief.upsert({
      where: { userToken_project: { userToken: payload.userToken, project: payload.project } },
      create: { userToken: payload.userToken, project: payload.project, brief },
      update: { brief },
    })
  },
})
