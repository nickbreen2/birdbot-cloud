/**
 * Read-only eval script: runs entity extraction against real CloudSession / CloudDecision rows.
 * Does NOT write to the DB. Prints extracted entities + relationships for each row.
 *
 * Usage:
 *   cd birdbot-cloud
 *   npx tsx src/scripts/test-extraction.ts
 */
import { config } from "dotenv"
config({ path: ".env.local" })

import Anthropic from "@anthropic-ai/sdk"
import { PrismaClient } from "@/generated/prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { neonConfig } from "@neondatabase/serverless"
import ws from "ws"
import {
  EXTRACTION_SYSTEM_PROMPT,
  EXTRACTION_TOOL,
  ExtractionResultSchema,
  buildUserMessage,
} from "@/lib/extractionPrompt"

neonConfig.webSocketConstructor = ws

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any)
const anthropic = new Anthropic()

async function extractFromText(
  text: string,
  sourceType: string,
  project: string | undefined,
  label: string
): Promise<void> {
  console.log(`\n${"=".repeat(70)}`)
  console.log(`SOURCE: ${label}`)
  console.log(`TEXT: ${text.slice(0, 300)}${text.length > 300 ? "..." : ""}`)
  console.log("-".repeat(70))

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [
      { role: "user", content: buildUserMessage(text, sourceType, project) },
    ],
    tools: [EXTRACTION_TOOL],
    tool_choice: { type: "tool", name: "extract_entities" },
  })

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "extract_entities"
  )

  if (!toolUse) {
    console.log("⚠️  No tool use block returned")
    return
  }

  function repairToolInput(input: unknown): unknown {
    if (typeof input !== "object" || input === null) return input
    const raw = input as Record<string, unknown>
    const patched: Record<string, unknown> = { ...raw }
    let repaired = false
    for (const key of ["entities", "relationships"]) {
      if (typeof patched[key] === "string") {
        try { patched[key] = JSON.parse(patched[key] as string); repaired = true } catch { /* leave as-is */ }
      }
    }
    if (repaired) console.log("⚠️  REPAIR: Haiku returned JSON string inside tool input — repaired via JSON.parse")
    return repaired ? patched : input
  }

  let parseResult = ExtractionResultSchema.safeParse(toolUse.input)
  if (!parseResult.success) {
    parseResult = ExtractionResultSchema.safeParse(repairToolInput(toolUse.input))
    if (!parseResult.success) {
      console.log("⚠️  Zod parse failed (even after repair attempt):", parseResult.error.message)
      console.log("Raw input:", JSON.stringify(toolUse.input, null, 2))
      return
    }
  }

  const { entities, relationships } = parseResult.data

  if (entities.length === 0) {
    console.log("(no entities extracted)")
  } else {
    console.log(`ENTITIES (${entities.length}):`)
    for (const e of entities) {
      const conf = (e.confidence * 100).toFixed(0)
      const desc = e.description ? ` — ${e.description}` : ""
      console.log(`  [${e.type.padEnd(12)}] ${conf}%  ${e.name}${desc}`)
    }
  }

  if (relationships.length > 0) {
    console.log(`\nRELATIONSHIPS (${relationships.length}):`)
    for (const r of relationships) {
      console.log(`  ${r.from} --[${r.label}]--> ${r.to}`)
    }
  }
}

async function main() {
  console.log("BirdBot P2 — extraction eval (read-only)\n")

  const [sessions, decisions] = await Promise.all([
    prisma.cloudSession.findMany({
      where: { summary: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { sessionId: true, project: true, summary: true, createdAt: true },
    }),
    prisma.cloudDecision.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, project: true, decision: true, reasoning: true, createdAt: true },
    }),
  ])

  console.log(`Found ${sessions.length} sessions, ${decisions.length} decisions`)

  if (sessions.length === 0 && decisions.length === 0) {
    console.log("No real data yet — running against sample text representative of BirdBot sessions\n")

    const samples: Array<{ text: string; sourceType: string; project: string; label: string }> = [
      {
        text: "Finished P1 knowledge graph schema sprint. Added Entity, Relationship, Mention, Goal, UserPreferences, TelegramUser, and TelegramPairingToken tables. Enabled pgvector extension with vector(1536) for OpenAI text-embedding-3-small. Ran prisma migrate deploy — all 8 migrations clean. Need to start P2 extraction pipeline next. Nick wants to run against real session data before wiring to inbound routes.",
        sourceType: "session",
        project: "birdbot-cloud",
        label: "Sample: P1 session summary",
      },
      {
        text: "Decided to use Trigger.dev v4 for all background tasks instead of custom queue. The async extraction pattern means text is stored immediately and graph is updated 2–5 seconds later. Using Claude Haiku for extraction because it's cost-sensitive and high volume — Sonnet would be too expensive at scale.",
        sourceType: "session",
        project: "birdbot-cloud",
        label: "Sample: Architecture decision",
      },
      {
        text: "I need to finish the Telegram integration before the soft launch. Also want to get the first personality preset working — probably start with Coach. Maybe I should add Google Calendar integration someday but that's probably out of scope for v1. Need to write smoke tests for the graph schema today and make sure cascade delete works.",
        sourceType: "session",
        project: "birdbot-cloud",
        label: "Sample: Mixed goals/tasks/vague",
      },
      {
        text: "use Prisma over Drizzle — better TypeScript ergonomics and the Neon adapter is production-ready. Drizzle would require more manual migration work and we're moving fast.",
        sourceType: "decision",
        project: "birdbot-cloud",
        label: "Sample: Decision row",
      },
      {
        text: "Working on the birdbot-mcp package today. Added search_entities tool and get_entity tool. The get_project_graph tool returns an adjacency list. Sarah reviewed the API design and suggested adding pagination to search results — good call. Blocked on the cloud API routes for entity creation, Nick needs to ship those first.",
        sourceType: "session",
        project: "birdbot-mcp",
        label: "Sample: Multi-entity with person + blocker",
      },
    ]

    for (const s of samples) {
      await extractFromText(s.text, s.sourceType, s.project, s.label)
    }
  } else {
    for (const s of sessions) {
      if (!s.summary) continue
      await extractFromText(
        s.summary,
        "session",
        s.project,
        `CloudSession ${s.sessionId.slice(0, 8)} (${s.createdAt.toISOString().slice(0, 10)})`
      )
    }

    for (const d of decisions) {
      const text = d.reasoning ? `${d.decision} — ${d.reasoning}` : d.decision
      await extractFromText(
        text,
        "decision",
        d.project,
        `CloudDecision ${d.id.slice(0, 8)} (${d.createdAt.toISOString().slice(0, 10)})`
      )
    }
  }

  console.log(`\n${"=".repeat(70)}`)
  console.log("Done. No DB writes were made.")
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
