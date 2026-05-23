# Proactive Bird: Daily Brief + Contextual Follow-ups

**Date:** 2026-05-22
**Status:** Approved

## Overview

BirdBot currently only responds when the user texts it. This spec covers two features that make Bird feel like a real assistant — one that pays attention between messages and reaches out proactively.

1. **Daily Brief** — Bird texts you every morning, asks what's on the agenda, and surfaces something relevant from its memory. Gets richer as integrations are added.
2. **Contextual Follow-ups** — When you mention an upcoming event, Bird schedules a check-in for after it happens and asks how it went.

---

## Feature 1: Daily Brief

### Behavior

A scheduled message every morning in Bird's voice. The content depends on which integrations the user has connected:

- **Level 1 (graph only):** Ask about the day, surface one relevant thing from the knowledge graph (active goal, recent entity, something in motion). Works for all users with no integrations required.
- **Level 2 (+ Google Calendar):** Prepend today's actual schedule before the agenda question.
- **Level 3 (+ Gmail):** Also include unread email highlights.
- **Level N:** Additional integrations enrich the brief further over time.

Example Level 1 output:
> "Morning. Anything on the agenda today? You've got the investor pitch prep still in motion — how's that sitting?"

Example Level 2 output (Calendar connected):
> "Morning. You've got a call at 2pm and the team sync at 4. Anything else going on today? Investor pitch prep still in motion — how's that coming?"

### Implementation

**Replace `morningBriefTask`** with a new `dailyBriefTask`:

- Runs on the same cron schedule: `0 7 * * *`
- Runs for **all paired Telegram users** — not gated on Google connection (the old brief skipped non-Google users, which was broken)
- Checks what integrations are connected per user, fetches relevant data
- Always pulls graph context via `getGraphContext()` — this is always available
- Calls a new `generateDailyBrief(context)` in a new `outboundPrompt.ts`
- Sends via `sendTelegramMessage()`

**New file: `src/lib/outboundPrompt.ts`**

Generates Bird-initiated messages. Same character as `replyPrompt.ts` but different mode — Bird is reaching out, not responding. Takes a context object (graph context + optional integration data + mode) and returns a message string.

Two modes:
- `daily_brief` — morning agenda message
- `follow_up` — checking in on a specific past event

**Subscription check:** same as `telegram.ts` — skip users with inactive subscriptions.

---

## Feature 2: Contextual Follow-ups

### Behavior

When you mention something upcoming in a message (e.g. "investor call on Friday", "pitching to the accelerator next Tuesday"), Bird:

1. Detects the time reference during extraction
2. Schedules a follow-up to fire after the event
3. Sends a natural check-in: "Hey, how did the investor call go?"

This is not part of the daily routine. It fires independently, when the moment is right.

### Implementation

**Enhancement to `telegram.ts`**

After entity extraction succeeds (inside `handleMessage()`), pass the user message and extraction result to a new `detectAndScheduleFollowUp()` function. This is the right place because it has both the userId/chatId and the extracted entities. This function:

1. Uses Claude Haiku to check if the message contains a future time reference and, if so, what the target date/time is
2. If a valid future time is found, triggers `followUpTask` with a delay calculated to fire 3 hours after the event end time. If the event ends after 8pm, the follow-up fires at 9am the next morning instead.
3. Uses a Trigger.dev idempotency key of `followup-{userId}-{entityName}-{date}` to prevent duplicate follow-ups

**New task: `src/trigger/followUp.ts`**

A standard Trigger.dev task (not a schedule). Triggered with a delay. Payload: `{ userId, chatId, entityName, entityType, eventDescription }`.

On run:
1. Checks subscription is still active — if not, skips
2. Pulls fresh graph context
3. Calls `generateDailyBrief()` in `follow_up` mode with the event info
4. Sends via Telegram

**Guardrails:**
- Only future events — if time reference is already past, skip
- One follow-up per event — idempotency key prevents duplicates
- Subscription check before sending
- Haiku parses the time reference; if it can't parse a confident date, skip (no follow-up is better than a wrong-timed one)

---

## Architecture Summary

```
morningBriefTask (deleted)
         ↓ replaced by
dailyBriefTask (cron 0 7 * * *)
  → getGraphContext()
  → getUpcomingEvents() [if Calendar connected]
  → getUnreadSummary() [if Gmail connected]
  → generateDailyBrief(context, "daily_brief")
  → sendTelegramMessage()

telegram.ts (after extraction)
  → detectAndScheduleFollowUp()
      → Haiku: parse time reference
      → followUpTask.trigger({ delay })

followUpTask (triggered with delay)
  → checkSubscription()
  → getGraphContext()
  → generateDailyBrief(context, "follow_up")
  → sendTelegramMessage()

outboundPrompt.ts (new)
  → generateDailyBrief(context, mode)
```

---

## Files Changed

| File | Action |
|------|--------|
| `src/trigger/morningBrief.ts` | Deleted |
| `src/trigger/dailyBrief.ts` | New — replaces morning brief |
| `src/trigger/followUp.ts` | New — contextual follow-up task |
| `src/lib/outboundPrompt.ts` | New — Bird-voiced outbound message generator |
| `src/trigger/telegram.ts` | Modified — add `detectAndScheduleFollowUp()` call after extraction |

---

## Out of Scope

- Per-user configurable brief timing (always 7am UTC for now)
- User opt-out of daily brief
- Follow-up on things mentioned in the brief itself
- Multi-event follow-ups in a single message (schedule only one follow-up per message)
