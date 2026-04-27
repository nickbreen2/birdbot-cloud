import { describe, it, expect, vi, beforeEach } from "vitest"

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  entityCreate: vi.fn(),
  mentionCreate: vi.fn(),
  relUpsert: vi.fn(),
  goalUpsert: vi.fn(),
  messagesCreate: vi.fn(),
}))

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: (...args: unknown[]) => mocks.messagesCreate(...args) }
  },
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    entity: {
      findFirst: (...args: unknown[]) => mocks.findFirst(...args),
      create: (...args: unknown[]) => mocks.entityCreate(...args),
    },
    goal: { upsert: (...args: unknown[]) => mocks.goalUpsert(...args) },
    relationship: { upsert: (...args: unknown[]) => mocks.relUpsert(...args) },
    mention: { create: (...args: unknown[]) => mocks.mentionCreate(...args) },
  },
}))

const NICK_TOOL_RESPONSE = {
  content: [
    {
      type: "tool_use",
      name: "extract_entities",
      input: {
        entities: [{ name: "Nick", type: "person", confidence: 0.95, description: "Developer" }],
        relationships: [],
      },
    },
  ],
}

const basePayload = {
  text: "Working with nick on the project.",
  sourceType: "session" as const,
  userId: "test-user-dedup",
  sourceId: "test-source-id",
  snippet: "Working with nick on the project.",
}

describe("runEntityExtraction — dedup", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.messagesCreate.mockResolvedValue(NICK_TOOL_RESPONSE)
    mocks.mentionCreate.mockResolvedValue({})
    mocks.goalUpsert.mockResolvedValue({})
    mocks.relUpsert.mockResolvedValue({})
  })

  it("reuses existing entity on case-insensitive match — entity.create NOT called", async () => {
    mocks.findFirst.mockResolvedValueOnce({ id: "existing-nick-id" })

    const { runEntityExtraction } = await import("@/trigger/extractEntities")
    const result = await runEntityExtraction(basePayload)

    expect(result.entitiesReused).toBe(1)
    expect(result.entitiesCreated).toBe(0)
    expect(mocks.entityCreate).not.toHaveBeenCalled()
  })

  it("findFirst query uses case-insensitive mode", async () => {
    mocks.findFirst.mockResolvedValueOnce({ id: "existing-nick-id" })

    const { runEntityExtraction } = await import("@/trigger/extractEntities")
    await runEntityExtraction(basePayload)

    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "test-user-dedup",
          name: expect.objectContaining({ mode: "insensitive" }),
        }),
      })
    )
  })

  it("attaches mention to the existing entity id when reused", async () => {
    mocks.findFirst.mockResolvedValueOnce({ id: "existing-nick-id" })

    const { runEntityExtraction } = await import("@/trigger/extractEntities")
    await runEntityExtraction(basePayload)

    expect(mocks.mentionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ entityId: "existing-nick-id" }),
      })
    )
  })

  it("creates new entity when none exists", async () => {
    mocks.findFirst.mockResolvedValueOnce(null)
    mocks.entityCreate.mockResolvedValueOnce({ id: "new-nick-id" })

    const { runEntityExtraction } = await import("@/trigger/extractEntities")
    const result = await runEntityExtraction(basePayload)

    expect(result.entitiesCreated).toBe(1)
    expect(result.entitiesReused).toBe(0)
    expect(mocks.entityCreate).toHaveBeenCalledOnce()
  })
})
