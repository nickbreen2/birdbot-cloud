# Connection Detection Design

**Date:** 2026-04-17
**Status:** Approved

## Overview

Tie a local birdbot-mcp install to a user's cloud account so the dashboard can show a real-time "Connected" state. When the user pastes the MCP config into their coding tool and runs `get_briefing`, the MCP pings our API with a user token — the dashboard flips from "waiting" to "Connected ✓".

## Database

New table in Neon Postgres: `McpConnection`

| column | type | notes |
|---|---|---|
| `id` | text (cuid) | primary key |
| `clerk_user_id` | text | unique — one row per user |
| `user_token` | text (uuid) | secret placed in MCP config |
| `last_seen_at` | timestamp | updated on every ping, nullable until first ping |
| `created_at` | timestamp | |

One row per user. Token is generated on first call to `GET /api/connection/token` and never rotated automatically.

## API Endpoints (birdbot-cloud)

### `GET /api/connection/token`
- Authenticated via Clerk session
- Finds or creates the `McpConnection` row for the current user
- Generates a UUID v4 token on creation
- Returns `{ token: string, last_seen_at: string | null }`

### `POST /api/mcp/ping`
- Unauthenticated (token is the credential)
- Body: `{ token: string }`
- Finds the matching `McpConnection` row, updates `last_seen_at` to now
- Returns 200 on success, 404 if token not found
- Silent failure — MCP treats any non-200 as a no-op

### `GET /api/connection/status`
- Authenticated via Clerk session
- Returns `{ connected: boolean, last_seen_at: string | null }`
- `connected` is true if `last_seen_at` is non-null and within the last 30 days

## birdbot-mcp Changes

Add `BIRDBOT_USER_TOKEN` to the MCP config env block:

```json
{
  "mcpServers": {
    "birdbot": {
      "command": "npx",
      "args": ["-y", "birdbot-mcp"],
      "env": {
        "ANTHROPIC_API_KEY": "YOUR_KEY_HERE",
        "BIRDBOT_USER_TOKEN": "their-uuid-here"
      }
    }
  }
}
```

In `src/index.ts`, the `get_briefing` handler fires a best-effort POST to `https://app.birdbot.ai/api/mcp/ping` with the token from `process.env.BIRDBOT_USER_TOKEN`. If the env var is absent or the request fails, execution continues normally. No new MCP tools exposed. No breaking changes.

## Dashboard UI (Connect Page)

### Snippet pre-fill
On mount, the Connect page calls `GET /api/connection/token`. While loading, the token field shows a skeleton placeholder. Once loaded, `BIRDBOT_USER_TOKEN` is pre-filled in the snippet with the real UUID. The copy button copies the full snippet including the token.

### Connection status bar
Below the snippet, a status indicator polls `GET /api/connection/status` every 5 seconds.

- **Before first ping:** `○ Waiting for connection...` (pulsing dot, amber)
- **After first ping:** `● Connected` (green dot) + "Last seen: just now"

Polling stops once `connected: true` is returned. On subsequent page visits, the last-seen state is shown immediately — no spinner on return visits.

## Data Flow

```
User opens Connect page
  → GET /api/connection/token (creates McpConnection row, returns UUID)
  → Token pre-filled in snippet

User copies snippet, pastes into coding tool, restarts tool
  → Tool calls get_briefing
  → birdbot-mcp fires POST /api/mcp/ping { token }
  → Server updates last_seen_at

Connect page polling (every 5s)
  → GET /api/connection/status
  → { connected: true } returned
  → UI flips to "Connected ✓", polling stops
```

## Error Handling

- Token fetch fails → Connect page shows snippet with `YOUR_TOKEN_HERE` placeholder and an inline error message
- Ping endpoint returns non-200 → MCP silently continues, briefing unaffected
- Status poll fails → UI keeps showing last known state, no crash

## Out of Scope

- Token rotation / revocation
- Multiple installs per user (one token per user for now)
- Paid agent features (Telegram, nudges) — separate sprint
