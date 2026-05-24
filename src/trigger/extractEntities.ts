import { task } from "@trigger.dev/sdk"
import Anthropic from "@anthropic-ai/sdk"
import { prisma } from "@/lib/prisma"
import { EntityType, GoalStatus, MentionSourceType } from "@/generated/prisma/enums"
import {
  EXTRACTION_SYSTEM_PROMPT,
  EXTRACTION_TOOL,
  ExtractionResultSchema,
  buildUserMessage,
} from "@/lib/extractionPrompt"

const anthropic = new Anthropic()

const GOAL_CONFIDENCE_THRESHOLD = 0.7

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
  if (repaired) {
    console.warn("[extractEntities] Haiku returned JSON string inside tool input — repaired via JSON.parse. Raw input:", JSON.stringify(input))
  }
  return repaired ? patched : input
}

export type ExtractEntitiesPayload = {
  text: string
  sourceType: "session" | "decision" | "telegram" | "whatsapp"
  userId: string
  userToken?: string
  project?: string
  sourceId: string
  snippet?: string
}

export type ExtractionRunResult = {
  entitiesCreated: number
  entitiesReused: number
  relationshipsCreated: number
  entities: { name: string; type: string }[]
  error?: string
}

export async function runEntityExtraction(payload: ExtractEntitiesPayload): Promise<ExtractionRunResult> {
  const { text, sourceType, userId, userToken, project, sourceId, snippet } = payload

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
    return { entitiesCreated: 0, entitiesReused: 0, relationshipsCreated: 0, entities: [], error: "no_tool_use" }
  }

  let parseResult = ExtractionResultSchema.safeParse(toolUse.input)
  if (!parseResult.success) {
    parseResult = ExtractionResultSchema.safeParse(repairToolInput(toolUse.input))
    if (!parseResult.success) {
      console.error("[extractEntities] Zod parse error:", parseResult.error.message)
      return { entitiesCreated: 0, entitiesReused: 0, relationshipsCreated: 0, entities: [], error: "zod_parse_failure" }
    }
  }

  const { entities, relationships } = parseResult.data

  const entityIdMap = new Map<string, string>()
  const processedEntities: { name: string; type: string }[] = []
  let entitiesCreated = 0
  let entitiesReused = 0

  for (const entity of entities) {
    const existing = await prisma.entity.findFirst({
      where: {
        userId,
        type: entity.type as EntityType,
        name: { equals: entity.name, mode: "insensitive" },
      },
      select: { id: true },
    })

    let entityId: string

    if (existing) {
      entityId = existing.id
      entitiesReused++
    } else {
      const created = await prisma.entity.create({
        data: {
          userId,
          userToken: userToken ?? null,
          project: project ?? null,
          name: entity.name,
          type: entity.type as EntityType,
          description: entity.description ?? null,
        },
        select: { id: true },
      })
      entityId = created.id
      entitiesCreated++

      if (entity.type === "goal") {
        const goalStatus: GoalStatus =
          entity.confidence >= GOAL_CONFIDENCE_THRESHOLD
            ? GoalStatus.active
            : GoalStatus.pending_confirmation

        await prisma.goal.upsert({
          where: { entityId },
          create: {
            userId,
            entityId,
            title: entity.name,
            description: entity.description ?? null,
            status: goalStatus,
            cadence: "weekly",
          },
          update: {},
        })
      }
    }

    entityIdMap.set(entity.name.toLowerCase(), entityId)
    processedEntities.push({ name: entity.name, type: entity.type })

    await prisma.mention.create({
      data: {
        userId,
        entityId,
        sourceType: sourceType as MentionSourceType,
        sourceId,
        snippet: snippet ?? null,
      },
    })
  }

  let relationshipsCreated = 0

  for (const rel of relationships) {
    const fromId = entityIdMap.get(rel.from.toLowerCase())
    const toId = entityIdMap.get(rel.to.toLowerCase())

    if (!fromId || !toId || fromId === toId) continue

    try {
      await prisma.relationship.upsert({
        where: {
          userId_fromId_toId_label: { userId, fromId, toId, label: rel.label },
        },
        create: { userId, fromId, toId, label: rel.label },
        update: {},
      })
      relationshipsCreated++
    } catch {
      // Race condition on upsert is acceptable — skip silently
    }
  }

  return { entitiesCreated, entitiesReused, relationshipsCreated, entities: processedEntities }
}

export const extractEntities = task({
  id: "extract-entities",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10_000,
  },
  run: runEntityExtraction,
})
