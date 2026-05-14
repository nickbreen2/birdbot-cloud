import { z } from "zod"

export const ENTITY_TYPES = [
  "file",
  "concept",
  "date",
  "decision",
  "task",
  "technology",
  "person",
  "goal",
] as const

export type ExtractionEntityType = typeof ENTITY_TYPES[number]

export const ExtractionEntitySchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(ENTITY_TYPES),
  description: z.string().max(500).optional(),
  confidence: z.number().min(0).max(1),
})

export const ExtractionRelationshipSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  label: z.string().min(1).max(100),
})

export const ExtractionResultSchema = z.object({
  entities: z.array(ExtractionEntitySchema),
  relationships: z.array(ExtractionRelationshipSchema),
})

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>

export const EXTRACTION_SYSTEM_PROMPT = `You are an entity extractor for a personal knowledge graph. Given text from a developer's session notes, decisions, or messages, extract named entities and the relationships between them.

ENTITY TYPES — pick the most specific type that fits:
- file: Use ONLY for source files that exist on disk with a file extension (.ts, .tsx, .md, .prisma, .env, etc.). Examples: "schema.prisma", "src/trigger/extractEntities.ts", ".env.local", "CLAUDE.md". Package names (birdbot-mcp, next), database table names, and project names are NOT file — use concept instead.
- concept: A named abstraction, subsystem, domain idea, schema object, package, or project name. Examples: "extraction pipeline", "billing pipeline", "knowledge graph", "AuthService", "Entity table", "UserPreferences", "birdbot-mcp". Database table names, schema models, package names, and project names are concept, not file.
- date: A point or span of time referenced in the message. Examples: "tonight", "next Tuesday", "by Friday", "end of sprint", "9pm", "this weekend", "tomorrow morning". Extract even when informal or relative — use the raw phrase as the name.
- decision: An architectural or product choice already made. Examples: "use Prisma over Drizzle", "deploy on Vercel", "skip TypeORM". Past-tense choices, not future intentions.
- task: A specific to-do, open issue, or blocker. Examples: "fix the login bug", "write tests for billing", "add rate limiting". Differs from goal: a task is bounded and specific; a goal is directional.
- technology: A library, framework, service, or external tool. Examples: "Stripe", "Next.js", "Neon", "Anthropic API", "Clerk", "Trigger.dev", "pgvector", "Claude Code", "Cursor".
- person: A specific individual. Examples: "Sarah", "Nick", "the CTO", "@user". Real people, not personas.
- goal: An objective or intention the user has. Examples: "ship by Friday", "raise seed round", "finish auth flow", "launch to waitlist". Extract when someone expresses an intention, target, or commitment.

CONFIDENCE SCORING (0.0–1.0):
- 1.0: Explicitly named and unambiguous. "I used Stripe" → technology/Stripe confidence 1.0
- 0.8–0.9: Clearly present, mentioned by name with clear context
- 0.6–0.7: Implied or referenced without full clarity; could be something else
- 0.4–0.5: Tentative — might be this entity but uncertain
- < 0.4: Very uncertain; only include if useful even at low confidence

For GOALS specifically — confidence reflects how committed the statement sounds:
- ≥ 0.7 (committed): "I need to", "I'm going to", "working on", "planning to", "want to ship"
- < 0.7 (vague): "maybe I should", "it would be nice to", "thinking about", "someday", "might"

RELATIONSHIP LABELS: short verb phrases. Examples: "uses", "depends_on", "part_of", "blocks", "implements", "replaces", "assigned_to", "runs_on", "related_to".

RULES:
1. Canonical names: extract clean names. "the Next.js framework" → name: "Next.js", type: "technology". "Entity table in the schema" → name: "Entity", type: "concept" (not file). "working on the birdbot-mcp package" → name: "birdbot-mcp", type: "concept" (not file — it's a package name, not a file on disk).
2. Extract relationships only when explicitly stated or strongly implied by the text
3. For developer notes and session logs, prefer precision — 5 clear entities beats 20 noisy ones. For casual or reminder-style messages (Telegram), prefer broader capture: "Remind me to brush my teeth tonight" should yield at least a task + date, not nothing. In all cases, skip type parameters like "vector(1536)", bare adjectives, and sentence fragments that only make sense within the sentence.
4. Skip generic references ("the database", "the API") unless they have a specific name
5. Skip the speaker/author as a person entity unless specifically discussed`

export const EXTRACTION_TOOL = {
  name: "extract_entities" as const,
  description: "Extract named entities and relationships from developer notes or messages.",
  input_schema: {
    type: "object" as const,
    properties: {
      entities: {
        type: "array",
        description: "Named entities found in the text",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Canonical name of the entity" },
            type: {
              type: "string",
              enum: [...ENTITY_TYPES] as string[],
              description: "Entity type — use 'date' for any time reference (tonight, next Tuesday, by Friday)",
            },
            description: { type: "string", description: "Optional 1-sentence description" },
            confidence: { type: "number", description: "Confidence score 0.0–1.0" },
          },
          required: ["name", "type", "confidence"] as string[],
        },
      },
      relationships: {
        type: "array",
        description: "Relationships between extracted entities",
        items: {
          type: "object",
          properties: {
            from: { type: "string", description: "Source entity name" },
            to: { type: "string", description: "Target entity name" },
            label: { type: "string", description: "Short verb phrase describing the relationship" },
          },
          required: ["from", "to", "label"] as string[],
        },
      },
    },
    required: ["entities", "relationships"] as string[],
  },
}

export function buildUserMessage(text: string, sourceType: string, project?: string): string {
  const header = [
    project ? `Project: ${project}` : null,
    `Source: ${sourceType}`,
  ]
    .filter(Boolean)
    .join(" | ")
  return header ? `${header}\n\n${text}` : text
}
