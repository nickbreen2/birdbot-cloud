# Proactive Bird: Daily Brief + Contextual Follow-ups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Bird proactively reach out with a daily morning brief (powered by the knowledge graph, upgraded with integrations) and contextual follow-up messages after events the user mentioned.

**Architecture:** Two new Trigger.dev tasks (`dailyBriefTask`, `followUpTask`) and two new lib files (`outboundPrompt.ts`, `followUpScheduler.ts`). The existing `morningBriefTask` is deleted and replaced by `dailyBriefTask`. The entity extraction pipeline in `telegram.ts` is extended to detect temporal markers and schedule follow-ups concurrently with reply generation.

**Tech Stack:** TypeScript, Trigger.dev SDK v4, Anthropic SDK (claude-haiku-4-5-20251001), Prisma, Vitest

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/outboundPrompt.ts` | Create | Bird-voiced outbound message generation (daily_brief and follow_up modes) |
| `src/trigger/followUp.ts` | Create | Trigger.dev task: waits until follow-up time, sends check-in message |
| `src/lib/followUpScheduler.ts` | Create | Temporal marker detection via Haiku + follow-up task scheduling |
| `src/trigger/dailyBrief.ts` | Create | Scheduled daily brief replacing morningBriefTask |
| `src/trigger/morningBrief.ts` | Delete | Superseded by dailyBrief.ts |
| `src/trigger/telegram.ts` | Modify | Wire detectAndScheduleFollowUp into handleMessage after extraction |
| `src/__tests__/outboundPrompt.test.ts` | Create | Unit tests for buildOutboundUserMessage |
| `src/__tests__/followUpScheduler.test.ts` | Create | Unit tests for computeFollowUpTime and buildFollowUpIdempotencyKey |

**Task order matters:** `outboundPrompt.ts` → `followUp.ts` → `followUpScheduler.ts` → `dailyBrief.ts` → `telegram.ts`. Each task imports from the previous ones — build in this order so TypeScript resolves imports at each step.

---

## Task 1: outboundPrompt.ts

The outbound message generator. Exports `buildOutboundUserMessage` (pure, testable) and `generateDailyBrief` (calls Anthropic Haiku). Used by both `followUp.ts` and `dailyBrief.ts`.

**Files:**
- Create: `src/lib/outboundPrompt.ts`
- Create: `src/__tests__/outboundPrompt.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/outboundPrompt.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import { buildOutboundUserMessage, OutboundContext } from "@/lib/outboundPrompt"

const baseContext: OutboundContext = {
  mode: "daily_brief",
  recentEntities: [],
  activeGoals: [],
  softGoals: [],
}

describe("buildOutboundUserMessage", () => {
  it("daily_brief with no context produces minimal message", () => {
    const result = buildOutboundUserMessage(baseContext)
    expect(result).toContain("Mode: daily_brief")
    expect(result).toContain("Recent context: none")
    expect(result).toContain("Active goals: none")
    expect(result).not.toContain("Calendar today:")
    expect(result).not.toContain("Unread emails")
  })

  it("daily_brief includes calendar events when provided", () => {
    const context: OutboundContext = {
      ...baseContext,
      calendarEvents: [{ title: "Investor call", start: "2026-05-22T14:00:00.000Z" }],
    }
    const result = buildOutboundUserMessage(context)
    expect(result).toContain("Calendar today:")
    expect(result).toContain("Investor call")
  })

  it("daily_brief includes unread emails when provided", () => {
    const context: OutboundContext = {
      ...baseContext,
      unreadEmails: [{ subject: "Re: Contract", from: "Sarah Smith <sarah@example.com>" }],
    }
    const result = buildOutboundUserMessage(context)
    expect(result).toContain("Unread emails (1): Re: Contract from Sarah Smith")
  })

  it("daily_brief includes recent entities in context", () => {
    const context: OutboundContext = {
      ...baseContext,
      recentEntities: [{ name: "BirdBot launch", type: "project", description: "on track for Friday" }],
    }
    const result = buildOutboundUserMessage(context)
    expect(result).toContain("BirdBot launch (project)")
    expect(result).toContain("on track for Friday")
  })

  it("follow_up includes follow-up entity", () => {
    const context: OutboundContext = {
      ...baseContext,
      mode: "follow_up",
      followUpEntity: { name: "investor call", type: "event" },
    }
    const result = buildOutboundUserMessage(context)
    expect(result).toContain("Mode: follow_up")
    expect(result).toContain("Follow-up subject: investor call (event)")
  })

  it("follow_up omits calendar and email sections even if provided", () => {
    const context: OutboundContext = {
      ...baseContext,
      mode: "follow_up",
      followUpEntity: { name: "investor call", type: "event" },
      calendarEvents: [{ title: "Some event", start: "2026-05-22T14:00:00.000Z" }],
    }
    const result = buildOutboundUserMessage(context)
    expect(result).not.toContain("Calendar today:")
  })

  it("limits recent entities to 5", () => {
    const context: OutboundContext = {
      ...baseContext,
      recentEntities: Array.from({ length: 8 }, (_, i) => ({ name: `Entity ${i}`, type: "task" })),
    }
    const result = buildOutboundUserMessage(context)
    expect(result).toContain("Entity 0")
    expect(result).not.toContain("Entity 5")
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd birdbot-cloud && npx vitest run src/__tests__/outboundPrompt.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/outboundPrompt'`

- [ ] **Step 3: Implement outboundPrompt.ts**

Create `src/lib/outboundPrompt.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd birdbot-cloud && npx vitest run src/__tests__/outboundPrompt.test.ts
```

Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/outboundPrompt.ts src/__tests__/outboundPrompt.test.ts
```

```bash
git commit -m "feat: add outboundPrompt.ts for Bird-voiced daily briefs and follow-ups"
```

---

## Task 2: followUp.ts (Trigger.dev task)

The Trigger.dev task that waits until the scheduled follow-up time, then sends a check-in message. Must be created before `followUpScheduler.ts` since the scheduler imports it to trigger it.

**Files:**
- Create: `src/trigger/followUp.ts`

- [ ] **Step 1: Create followUp.ts**

```typescript
import { task, wait } from "@trigger.dev/sdk"
import { prisma } from "@/lib/prisma"
import { sendTelegramMessage } from "@/lib/telegram"
import { getGraphContext } from "@/lib/graphContext"
import { generateDailyBrief } from "@/lib/outboundPrompt"

export type FollowUpPayload = {
  userId: string
  chatId: number
  entityName: string
  entityType: string
  followUpAt: string
}

async function checkSubscription(userId: string): Promise<boolean> {
  const adminUserIds = (process.env.ADMIN_CLERK_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (adminUserIds.includes(userId)) return true

  const subscription = await prisma.subscription.findUnique({
    where: { clerkUserId: userId },
    select: { status: true, currentPeriodEnd: true },
  })
  return !!(
    subscription &&
    (subscription.status === "active" || subscription.status === "trialing") &&
    subscription.currentPeriodEnd > new Date()
  )
}

export const followUpTask = task({
  id: "follow-up",
  run: async (payload: FollowUpPayload) => {
    await wait.until({ date: new Date(payload.followUpAt) })

    const isActive = await checkSubscription(payload.userId)
    if (!isActive) return

    const context = await getGraphContext(payload.userId)
    const message = await generateDailyBrief(
      {
        ...context,
        mode: "follow_up",
        followUpEntity: { name: payload.entityName, type: payload.entityType },
      },
      `Hey, how did the ${payload.entityName} go?`
    )

    await sendTelegramMessage(payload.chatId, message)
  },
})
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd birdbot-cloud && npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/trigger/followUp.ts
```

```bash
git commit -m "feat: add follow-up Trigger.dev task for contextual event check-ins"
```

---

## Task 3: followUpScheduler.ts

Temporal marker detection and follow-up scheduling. Exports pure helper functions for testing, and `detectAndScheduleFollowUp` for use in `telegram.ts`.

**Files:**
- Create: `src/lib/followUpScheduler.ts`
- Create: `src/__tests__/followUpScheduler.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/followUpScheduler.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest"

vi.mock("@/trigger/followUp", () => ({
  followUpTask: { trigger: vi.fn() },
}))

import { computeFollowUpTime, buildFollowUpIdempotencyKey } from "@/lib/followUpScheduler"

describe("computeFollowUpTime", () => {
  it("event at 2pm returns 5pm same day", () => {
    const event = new Date(2026, 4, 22, 14, 0, 0)
    const result = computeFollowUpTime(event)
    expect(result.getDate()).toBe(22)
    expect(result.getHours()).toBe(17)
    expect(result.getMinutes()).toBe(0)
  })

  it("event at exactly 8pm returns 9am next morning", () => {
    const event = new Date(2026, 4, 22, 20, 0, 0)
    const result = computeFollowUpTime(event)
    expect(result.getDate()).toBe(23)
    expect(result.getHours()).toBe(9)
    expect(result.getMinutes()).toBe(0)
  })

  it("event at 9pm returns 9am next morning", () => {
    const event = new Date(2026, 4, 22, 21, 0, 0)
    const result = computeFollowUpTime(event)
    expect(result.getDate()).toBe(23)
    expect(result.getHours()).toBe(9)
    expect(result.getMinutes()).toBe(0)
  })

  it("event at 7:59pm returns 3 hours later same day", () => {
    const event = new Date(2026, 4, 22, 19, 59, 0)
    const result = computeFollowUpTime(event)
    expect(result.getDate()).toBe(22)
    expect(result.getHours()).toBe(22)
    expect(result.getMinutes()).toBe(59)
  })
})

describe("buildFollowUpIdempotencyKey", () => {
  it("produces a stable key for same inputs", () => {
    const date = new Date(2026, 4, 22, 14, 0, 0)
    const key1 = buildFollowUpIdempotencyKey("user123", "investor call", date)
    const key2 = buildFollowUpIdempotencyKey("user123", "investor call", date)
    expect(key1).toBe(key2)
  })

  it("includes userId, slugified entity name, and date", () => {
    const date = new Date(2026, 4, 22, 14, 0, 0)
    const key = buildFollowUpIdempotencyKey("user_abc", "Investor Call", date)
    expect(key).toContain("user_abc")
    expect(key).toContain("investor-call")
    expect(key).toMatch(/2026-05-22/)
  })

  it("different entity names produce different keys", () => {
    const date = new Date(2026, 4, 22, 14, 0, 0)
    const key1 = buildFollowUpIdempotencyKey("user123", "investor call", date)
    const key2 = buildFollowUpIdempotencyKey("user123", "team standup", date)
    expect(key1).not.toBe(key2)
  })

  it("different dates produce different keys", () => {
    const key1 = buildFollowUpIdempotencyKey("user123", "call", new Date(2026, 4, 22, 14, 0, 0))
    const key2 = buildFollowUpIdempotencyKey("user123", "call", new Date(2026, 4, 23, 14, 0, 0))
    expect(key1).not.toBe(key2)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd birdbot-cloud && npx vitest run src/__tests__/followUpScheduler.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/followUpScheduler'`

- [ ] **Step 3: Implement followUpScheduler.ts**

Create `src/lib/followUpScheduler.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd birdbot-cloud && npx vitest run src/__tests__/followUpScheduler.test.ts
```

Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/followUpScheduler.ts src/__tests__/followUpScheduler.test.ts
```

```bash
git commit -m "feat: add followUpScheduler to detect temporal markers and schedule follow-ups"
```

---

## Task 4: dailyBrief.ts + delete morningBrief.ts

The new scheduled daily brief. Runs for all paired users. Levels up from graph-only to calendar+email when a Google connection exists. Replaces `morningBriefTask` entirely.

**Files:**
- Create: `src/trigger/dailyBrief.ts`
- Delete: `src/trigger/morningBrief.ts`

- [ ] **Step 1: Create dailyBrief.ts**

```typescript
import { schedules } from "@trigger.dev/sdk"
import { prisma } from "@/lib/prisma"
import { sendTelegramMessage } from "@/lib/telegram"
import { getGraphContext } from "@/lib/graphContext"
import { generateDailyBrief } from "@/lib/outboundPrompt"
import { getUpcomingEvents } from "@/lib/googleCalendar"
import { getUnreadSummary } from "@/lib/googleGmail"

async function checkSubscription(userId: string): Promise<boolean> {
  const adminUserIds = (process.env.ADMIN_CLERK_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (adminUserIds.includes(userId)) return true

  const subscription = await prisma.subscription.findUnique({
    where: { clerkUserId: userId },
    select: { status: true, currentPeriodEnd: true },
  })
  return !!(
    subscription &&
    (subscription.status === "active" || subscription.status === "trialing") &&
    subscription.currentPeriodEnd > new Date()
  )
}

export const dailyBriefTask = schedules.task({
  id: "daily-brief",
  cron: "0 7 * * *",
  run: async () => {
    const telegramUsers = await prisma.telegramUser.findMany({
      select: { userId: true, telegramChatId: true },
    })

    for (const tgUser of telegramUsers) {
      const isActive = await checkSubscription(tgUser.userId)
      if (!isActive) continue

      try {
        const [graphContext, googleConn] = await Promise.all([
          getGraphContext(tgUser.userId),
          prisma.googleConnection.findUnique({
            where: { userId: tgUser.userId },
            select: { id: true },
          }),
        ])

        let calendarEvents: { title: string; start: string }[] | undefined
        let unreadEmails: { subject: string; from: string }[] | undefined

        if (googleConn) {
          const [events, emails] = await Promise.all([
            getUpcomingEvents(tgUser.userId, 1),
            getUnreadSummary(tgUser.userId, 3),
          ])
          calendarEvents = events
          unreadEmails = emails
        }

        const message = await generateDailyBrief(
          {
            ...graphContext,
            mode: "daily_brief",
            calendarEvents,
            unreadEmails,
          },
          "Morning. Anything on the agenda today?"
        )

        await sendTelegramMessage(parseInt(tgUser.telegramChatId, 10), message)
      } catch (err) {
        console.error(`[dailyBrief] failed for user ${tgUser.userId}:`, err)
      }
    }
  },
})
```

- [ ] **Step 2: Delete morningBrief.ts**

```bash
rm birdbot-cloud/src/trigger/morningBrief.ts
```

- [ ] **Step 3: Check for any lingering references to morningBrief**

```bash
grep -r "morningBrief" birdbot-cloud/src birdbot-cloud/trigger.config.ts 2>/dev/null
```

Expected: No output. If any references appear, remove them before continuing.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd birdbot-cloud && npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/trigger/dailyBrief.ts
```

```bash
git rm src/trigger/morningBrief.ts
```

```bash
git commit -m "feat: replace morningBriefTask with dailyBriefTask supporting leveled integrations"
```

---

## Task 5: Wire followUpScheduler into telegram.ts

Modify `handleMessage` to call `detectAndScheduleFollowUp` concurrently with reply generation when entities are present. This adds zero latency to the user-facing reply.

**Files:**
- Modify: `src/trigger/telegram.ts`

- [ ] **Step 1: Add the import**

At the top of `src/trigger/telegram.ts`, after the existing imports, add:

```typescript
import { detectAndScheduleFollowUp } from "@/lib/followUpScheduler"
```

- [ ] **Step 2: Replace the success branch in handleMessage**

Find this block (around line 334 in the original file — it is the last block in `handleMessage`, after the `if (total === 0)` early return):

```typescript
  const reply = await generateBirdReply(
    {
      text,
      entities: result.entities,
      counts: { entitiesCreated: result.entitiesCreated, entitiesUpdated: result.entitiesReused, totalEntities: total },
      error: false,
      ...context,
    },
    "Got it."
  )
  await sendTelegramMessage(chatId, reply)
```

Replace it with:

```typescript
  const [reply] = await Promise.all([
    generateBirdReply(
      {
        text,
        entities: result.entities,
        counts: { entitiesCreated: result.entitiesCreated, entitiesUpdated: result.entitiesReused, totalEntities: total },
        error: false,
        ...context,
      },
      "Got it."
    ),
    detectAndScheduleFollowUp(
      userId,
      chatId,
      text,
      result.entities.map((e) => ({ name: e.name, type: e.type }))
    ),
  ])
  await sendTelegramMessage(chatId, reply)
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd birdbot-cloud && npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 4: Run full test suite**

```bash
cd birdbot-cloud && npm test
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/trigger/telegram.ts
```

```bash
git commit -m "feat: wire detectAndScheduleFollowUp into telegram message handler"
```

---

## Deployment

After all tasks are committed, deploy to Trigger.dev to activate the new tasks:

```bash
cd birdbot-cloud && npx trigger.dev@latest deploy
```

After deploying, go to the Trigger.dev dashboard and:
1. Attach the `0 7 * * *` cron schedule to `daily-brief` (same as the old `morning-brief`)
2. Deactivate or delete the `morning-brief` schedule from the dashboard

The `follow-up` task is triggered on demand — no schedule to attach.
