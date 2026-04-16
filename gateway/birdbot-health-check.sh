#!/bin/bash
# BirdBot Agent Health Checker — S2-18
#
# Queries the local Caddy admin API for all registered agent routes,
# checks each agent container's /health endpoint via its pool-server port,
# and tracks consecutive failure counts in a JSON state file.
#
# Run via systemd timer every 60 seconds.
# View logs with: journalctl -t birdbot-health -f

set -euo pipefail

STATE_DIR="/var/lib/birdbot"
STATE_FILE="${STATE_DIR}/health-state.json"
CADDY_ADMIN="http://localhost:2019"
LOG_TAG="birdbot-health"
SSH_KEY="/root/.ssh/birdbot_provisioner"
RESTART_THRESHOLD=5  # restart after this many consecutive failures, and every Nth after

log()     { logger -t "$LOG_TAG" -p user.info "$*"; }
log_err() { logger -t "$LOG_TAG" -p user.err  "$*"; }

# ── Ensure state directory and file exist ────────────────────────────────────
mkdir -p "$STATE_DIR"
if [[ ! -f "$STATE_FILE" ]] || ! jq '.' "$STATE_FILE" > /dev/null 2>&1; then
  echo '{}' > "$STATE_FILE"
fi

# ── Fetch all routes from Caddy admin API ────────────────────────────────────
ROUTES_JSON=$(curl -sf "${CADDY_ADMIN}/config/apps/http/servers/srv0/routes" 2>/dev/null) || {
  log_err "Failed to fetch Caddy routes — Caddy may be down"
  exit 1
}

# ── Filter to agent routes only (exclude route-catchall) ─────────────────────
AGENT_ROUTES=$(echo "$ROUTES_JSON" | \
  jq -c '[.[] | select((.["@id"] // "") | (startswith("route-") and . != "route-catchall"))]')
AGENT_COUNT=$(echo "$AGENT_ROUTES" | jq 'length')

log "Health check starting — ${AGENT_COUNT} agent route(s)"

if [[ "$AGENT_COUNT" -eq 0 ]]; then
  log "No active agents — nothing to check"
  exit 0
fi

# ── Check each agent ──────────────────────────────────────────────────────────
while IFS= read -r route; do
  ROUTE_ID=$(echo "$route" | jq -r '.["@id"]')
  AGENT_ID="${ROUTE_ID#route-}"
  DIAL=$(echo "$route" | jq -r '.handle[0].upstreams[0].dial // empty')

  if [[ -z "$DIAL" ]]; then
    log_err "Agent ${AGENT_ID}: cannot parse upstream dial from Caddy route — skipping"
    continue
  fi

  SERVER_IP="${DIAL%%:*}"
  HOST_PORT="${DIAL##*:}"

  # ── HTTP health check (5-second timeout) ────────────────────────────────────
  HTTP_CODE=$(curl -sf --max-time 5 \
    --write-out "%{http_code}" --output /dev/null \
    "http://${SERVER_IP}:${HOST_PORT}/health" 2>/dev/null || echo "000")

  # ── Read current failure count from state file ───────────────────────────────
  FAILURES=$(jq --arg id "$AGENT_ID" '.[$id] // 0' "$STATE_FILE")

  if [[ "$HTTP_CODE" == "200" ]]; then
    if [[ "$FAILURES" -gt 0 ]]; then
      log "Agent ${AGENT_ID}: RECOVERED after ${FAILURES} consecutive failure(s)"
    else
      log "Agent ${AGENT_ID}: healthy"
    fi
    # Clear failure count (delete key from state)
    jq --arg id "$AGENT_ID" 'del(.[$id])' "$STATE_FILE" > "${STATE_FILE}.tmp"
    mv "${STATE_FILE}.tmp" "$STATE_FILE"
  else
    NEW_FAILURES=$(( FAILURES + 1 ))
    log_err "Agent ${AGENT_ID}: UNHEALTHY — HTTP ${HTTP_CODE} from ${SERVER_IP}:${HOST_PORT} (consecutive failures: ${NEW_FAILURES})"
    jq --arg id "$AGENT_ID" --argjson n "$NEW_FAILURES" \
      '.[$id] = $n' "$STATE_FILE" > "${STATE_FILE}.tmp"
    mv "${STATE_FILE}.tmp" "$STATE_FILE"

    # ── Auto-restart on every Nth consecutive failure ──────────────────────────
    if (( NEW_FAILURES % RESTART_THRESHOLD == 0 )); then
      log "Agent ${AGENT_ID}: ${NEW_FAILURES} consecutive failures — attempting container restart on ${SERVER_IP}"
      if ssh -i "$SSH_KEY" \
           -o StrictHostKeyChecking=accept-new \
           -o ConnectTimeout=10 \
           -o BatchMode=yes \
           "root@${SERVER_IP}" \
           "docker restart birdbot-${AGENT_ID}" 2>/dev/null; then
        log "Agent ${AGENT_ID}: container restarted successfully — resetting failure counter"
        jq --arg id "$AGENT_ID" 'del(.[$id])' "$STATE_FILE" > "${STATE_FILE}.tmp"
        mv "${STATE_FILE}.tmp" "$STATE_FILE"
      else
        log_err "Agent ${AGENT_ID}: container restart FAILED — will retry in $((RESTART_THRESHOLD * 60))s"
      fi
    fi
  fi

done < <(echo "$AGENT_ROUTES" | jq -c '.[]')

log "Health check complete"
