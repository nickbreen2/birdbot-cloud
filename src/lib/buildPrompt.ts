export function buildPrompt(token: string, projectName: string): string {
  return `## BirdBot Memory

You have access to BirdBot — a persistent memory layer for this project.

At the START of every session, call:
  GET https://app.birdbot.ai/api/mcp/briefing?project=${projectName}
  Authorization: Bearer ${token}
Read the returned briefing as your project context. Use the returned sessionId in all subsequent BirdBot calls this session.

When you make a significant architectural decision, call:
  POST https://app.birdbot.ai/api/mcp/decisions
  Authorization: Bearer ${token}
  Body: { "project": "${projectName}", "sessionId": "<sessionId from briefing>", "decision": "...", "reasoning": "..." }

At the END of every session, call:
  POST https://app.birdbot.ai/api/mcp/sessions
  Authorization: Bearer ${token}
  Body: { "project": "${projectName}", "sessionId": "<sessionId from briefing>", "summary": "..." }`
}
