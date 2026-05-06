# Google Integration Design

**Date:** 2026-05-06
**Status:** Approved
**Scope:** Google Calendar, Gmail, Drive — OAuth, token storage, API wrappers, Bird integration, Dashboard UI

---

## Overview

BirdBot users can connect their Google account once and Bird gains read + light write access to Calendar, Gmail, and Drive. Google data surfaces both proactively (morning briefings) and reactively (on-demand Telegram queries). All write actions require explicit user confirmation before executing.

---

## 1. Database Schema

Two new Prisma models.

### `GoogleConnection`

One row per user. Stores OAuth tokens and granted scopes.

```prisma
model GoogleConnection {
  id           String   @id @default(cuid())
  userId       String   @unique
  accessToken  String
  refreshToken String
  expiresAt    DateTime
  scopes       String[]
  email        String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([userId])
}
```

`scopes` stored as an array so Bird knows what it's allowed to do without guessing. `email` displayed in the dashboard connect card.

### `PendingAction`

Staged write actions awaiting user confirmation. Expires after 10 minutes.

```prisma
model PendingAction {
  id        String   @id @default(cuid())
  userId    String
  type      String   // "calendar_create" | "email_send" | "drive_create"
  payload   Json
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
}
```

---

## 2. OAuth Flow

Four API routes following the existing Telegram integration pattern.

| Route | Method | Purpose |
|---|---|---|
| `/api/google/connect` | GET | Build OAuth URL, redirect to Google consent screen |
| `/api/google/callback` | GET | Exchange code for tokens, write `GoogleConnection`, redirect to `/dashboard/integrations` |
| `/api/google/disconnect` | DELETE | Delete `GoogleConnection` row, revoke token with Google |
| `/api/google/status` | GET | Return connected state + linked email for dashboard |

**Scopes requested (all at once):**
```
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/gmail.modify
https://www.googleapis.com/auth/drive
```

**CSRF protection:** The `state` param encodes the Clerk `userId` as an HMAC-signed value. The callback verifies the signature before trusting the userId.

---

## 3. Token Refresh

**Layer 1 — Lazy refresh (primary)**
`getGoogleClient(userId)` checks if `expiresAt < now + 5 minutes` before every API call. If so, refreshes the access token, updates the DB row, and returns a fresh client. All wrappers call this — they never touch tokens directly.

**Layer 2 — Trigger.dev cron (safety net)**
Runs every 45 minutes. Finds any `GoogleConnection` where `expiresAt < now + 10 minutes` and proactively refreshes.

**On refresh failure (token revoked):**
1. Delete the `GoogleConnection` row
2. Send the user a Telegram message: *"Heads up — your Google connection was disconnected. Reconnect from your dashboard when you're ready."*
3. Bird stops attempting Google calls until reconnected

**Shared helper:** `src/lib/google.ts` exports `getGoogleClient(userId): Promise<OAuth2Client>`

---

## 4. API Wrappers

All wrappers take `userId` as the first argument and call `getGoogleClient` internally.

### `src/lib/googleCalendar.ts`
```ts
getUpcomingEvents(userId, days?: number)   // next N days of events, default 7
createEvent(userId, details)               // title, start, end, description, attendees
```

### `src/lib/googleGmail.ts`
```ts
getUnreadSummary(userId, maxResults?: number)  // subject + sender of recent unreads
getThread(userId, threadId)                    // full thread for context
draftEmail(userId, details)                    // saves as draft, does NOT send
sendEmail(userId, details)                     // sends immediately — only called after confirmation
```

### `src/lib/googleDrive.ts`
```ts
searchFiles(userId, query)           // search by name or content
getFile(userId, fileId)              // metadata + text content
createDoc(userId, title, content)    // creates a Google Doc
```

`draftEmail` and `sendEmail` are separate functions. The Telegram handler can never call `sendEmail` without going through the confirmation step first.

---

## 5. Bird + Telegram Integration

### Proactive — Morning Briefing

`src/trigger/brief.ts` extended to pull Google data for connected users:
- `getUpcomingEvents` → today's events as a bullet list
- `getUnreadSummary` → unread count + top 3 email subjects

Drive is excluded from briefings (too noisy).

### Reactive — On-demand queries

The Telegram webhook handler detects Google intent from the user's message and calls the appropriate wrapper. Examples:

- *"What's on my calendar Friday?"* → `getUpcomingEvents`
- *"Any important emails?"* → `getUnreadSummary`
- *"Find my Q1 budget doc"* → `searchFiles`

### Confirm-before-write flow

All write actions are staged in `PendingAction` before executing. Bird presents the action to the user and waits for confirmation:

```
Bird: "Got it — here's the event I'd create:
  📅 Investor call with Sarah
  Thursday May 9, 2pm–3pm
  Confirm? (yes / no)"

User: yes

Bird: "Done, it's on your calendar."
```

Rules:
- Confirmation response: `yes` or `confirm` (case-insensitive) executes the action
- Anything else discards it
- `PendingAction` auto-expires after 10 minutes
- Only one pending action per user at a time — a new write request replaces the previous pending action

---

## 6. Dashboard UI

**Connect state:** Each Google card (Calendar, Gmail, Drive) shows a "Connect" button. All three trigger the same `/api/google/connect` redirect — one OAuth flow for all three services.

**Connected state:** All three cards show a green "Connected" badge and the linked Google email. A `⋮` menu on any card offers "Disconnect" which disconnects all three.

**Connect modal:** Brief explanation + "Connect Google Account" button → OAuth redirect. After OAuth completes, callback redirects to `/dashboard/integrations` and the page reflects connected state.

**Files changed:**
- `src/app/dashboard/integrations/page.tsx` — wire Google cards with live state
- No new pages needed

---

## Implementation Order

1. DB migration — add `GoogleConnection` + `PendingAction`
2. OAuth routes — connect, callback, disconnect, status
3. `src/lib/google.ts` — `getGoogleClient` helper + token refresh logic
4. Trigger.dev cron — proactive token refresh
5. API wrappers — Calendar, Gmail, Drive
6. Telegram handler — intent detection + confirm-before-write flow
7. Morning briefing — extend `brief.ts` with Google data
8. Dashboard UI — wire Google cards in integrations page
9. Env vars — `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_STATE_SECRET`
