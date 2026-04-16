import { task, wait } from "@trigger.dev/sdk"
import { Client } from "ssh2"
import { prisma } from "@/lib/prisma"

const HETZNER_API = "https://api.hetzner.cloud/v1"
const DOCKER_IMAGE = "ghcr.io/nickbreen2/birdbot-agent:latest"
const SSH_KEY_ID = 110803215
const FIREWALL_ID = 10842946
const SERVER_TYPE = "cpx21"
const LOCATION = "ash"
const OS_IMAGE = "ubuntu-24.04"

// ─── SSH ──────────────────────────────────────────────────────────────────────

function sshExec(ip: string, privateKey: string, command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const conn = new Client()
    let stdout = ""
    let stderr = ""

    conn.on("ready", () => {
      conn.exec(command, (err, stream) => {
        if (err) {
          conn.end()
          reject(err)
          return
        }
        stream.on("close", (code: number) => {
          conn.end()
          if (code !== 0) reject(new Error(`Exit ${code}: ${stderr.trim() || "(no stderr)"}`))
          else resolve(stdout.trim())
        })
        stream.on("data", (data: Buffer) => { stdout += data.toString() })
        stream.stderr.on("data", (data: Buffer) => { stderr += data.toString() })
      })
    })

    conn.on("error", reject)

    conn.connect({
      host: ip,
      port: 22,
      username: "root",
      privateKey,
      readyTimeout: 30_000,
      // Fresh Hetzner servers have unknown host fingerprints — skip verification
      hostVerifier: () => true,
    })
  })
}

// Poll until SSH accepts connections (sshd starts a few seconds after "running")
async function sshWaitReady(ip: string, privateKey: string): Promise<void> {
  for (let i = 0; i < 12; i++) {
    try {
      await sshExec(ip, privateKey, "echo ok")
      return
    } catch {
      await wait.for({ seconds: 10 })
    }
  }
  throw new Error(`SSH not ready on ${ip} after 2 minutes`)
}

// ─── Port allocation ─────────────────────────────────────────────────────────

const PORT_RANGE_START = 20000
const PORT_RANGE_END   = 29999

async function pickFreePort(serverDbId: string): Promise<number> {
  const used = await prisma.agent.findMany({
    where: { serverId: serverDbId, hostPort: { not: null } },
    select: { hostPort: true },
  })
  const usedSet = new Set(used.map(a => a.hostPort!))
  const range = PORT_RANGE_END - PORT_RANGE_START + 1
  const start = Math.floor(Math.random() * range)
  for (let i = 0; i < range; i++) {
    const port = PORT_RANGE_START + ((start + i) % range)
    if (!usedSet.has(port)) return port
  }
  throw new Error(`No free ports available on server ${serverDbId}`)
}

// ─── Hetzner API ──────────────────────────────────────────────────────────────

function hetznerHeaders() {
  return {
    Authorization: `Bearer ${process.env.HETZNER_API_TOKEN!}`,
    "Content-Type": "application/json",
  }
}

async function hetznerCreateServer(name: string): Promise<{ id: number; ip: string }> {
  const res = await fetch(`${HETZNER_API}/servers`, {
    method: "POST",
    headers: hetznerHeaders(),
    body: JSON.stringify({
      name,
      server_type: SERVER_TYPE,
      location: LOCATION,
      image: OS_IMAGE,
      ssh_keys: [SSH_KEY_ID],
      firewalls: [{ firewall: FIREWALL_ID }],
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Hetzner create failed ${res.status}: ${body}`)
  }
  const data = await res.json()
  return { id: data.server.id, ip: data.server.public_net.ipv4.ip }
}

async function hetznerPollRunning(serverId: number): Promise<void> {
  for (let i = 0; i < 30; i++) {
    await wait.for({ seconds: 10 })
    const res = await fetch(`${HETZNER_API}/servers/${serverId}`, {
      headers: hetznerHeaders(),
    })
    if (!res.ok) throw new Error(`Hetzner poll failed ${res.status}`)
    const data = await res.json()
    if (data.server.status === "running") return
  }
  throw new Error("Server did not reach running state within 5 minutes")
}

async function hetznerDeleteServer(serverId: number): Promise<void> {
  await fetch(`${HETZNER_API}/servers/${serverId}`, {
    method: "DELETE",
    headers: hetznerHeaders(),
  })
}

// ─── Caddy route management ───────────────────────────────────────────────────

const AGENTS_DOMAIN = "agents.birdbot.ai"

async function registerCaddyRoute(
  agentId: string,
  serverIp: string,
  hostPort: number,
  privateKey: string,
): Promise<void> {
  const gatewayIp = process.env.GATEWAY_IP
  if (!gatewayIp) {
    console.log("GATEWAY_IP not set — skipping Caddy route registration")
    return
  }
  const route = {
    "@id": `route-${agentId}`,
    match: [{ host: [`${agentId}.${AGENTS_DOMAIN}`] }],
    handle: [{ handler: "reverse_proxy", upstreams: [{ dial: `${serverIp}:${hostPort}` }] }],
    terminal: true,
  }
  const b64 = Buffer.from(JSON.stringify(route)).toString("base64")
  try {
    // 1. Capture the catch-all route so we can re-append it after the agent route.
    //    Caddy's POST appends to the array, so agent routes must go before the catch-all.
    let catchallJson: string | null = null
    try {
      const raw = await sshExec(gatewayIp, privateKey, "curl -s http://localhost:2019/id/route-catchall")
      const parsed = JSON.parse(raw)
      if (parsed?.["@id"] === "route-catchall") catchallJson = raw
    } catch {
      // No catch-all present — route ordering is not a concern
    }

    // 2. Remove catch-all temporarily (if present)
    if (catchallJson) {
      await sshExec(gatewayIp, privateKey, "curl -sf -X DELETE http://localhost:2019/id/route-catchall")
    }

    // 2b. Remove existing agent route if present (idempotent re-registration)
    await sshExec(
      gatewayIp,
      privateKey,
      `curl -s -X DELETE http://localhost:2019/id/route-${agentId} || true`,
    )

    // 3. Append the agent route
    await sshExec(
      gatewayIp,
      privateKey,
      `echo '${b64}' | base64 -d | curl -sf -X POST http://localhost:2019/config/apps/http/servers/srv0/routes -H 'Content-Type: application/json' --data-binary @-`,
    )

    // 4. Re-append catch-all at the end so it stays last
    if (catchallJson) {
      const catchallB64 = Buffer.from(catchallJson).toString("base64")
      await sshExec(
        gatewayIp,
        privateKey,
        `echo '${catchallB64}' | base64 -d | curl -sf -X POST http://localhost:2019/config/apps/http/servers/srv0/routes -H 'Content-Type: application/json' --data-binary @-`,
      )
    }

    console.log(`Caddy route registered: ${agentId}.${AGENTS_DOMAIN} → ${serverIp}:${hostPort}`)
  } catch (e) {
    // Log but don't fail provisioning — route can be re-registered once gateway is stable
    console.error(`Caddy route registration failed (non-fatal): ${e instanceof Error ? e.message : e}`)
  }
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export const provisionAgent = task({
  id: "provision-agent",
  // No auto-retry — partial side effects (server created, container started) mean
  // we handle cleanup inline and surface the error on the Agent record instead.
  retry: { maxAttempts: 1 },
  maxDuration: 600, // 10 minutes
  run: async (payload: { agentId: string; clerkUserId: string }) => {
    const { agentId, clerkUserId } = payload

    const privateKey = Buffer.from(
      process.env.HETZNER_SSH_PRIVATE_KEY!,
      "base64"
    ).toString("utf8")

    // 1. Load agent and verify ownership
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, clerkUserId },
    })
    if (!agent) throw new Error(`Agent ${agentId} not found`)

    // Guard: already active — don't re-provision
    if (agent.status === "active") {
      console.log(`Agent ${agentId} is already active — skipping provisioning`)
      return { success: true, agentId, skipped: true }
    }

    // Rollback tracking
    let isNewServer = false
    let newHetznerServerId: number | null = null
    let newServerDbId: string | null = null
    let targetServerDbId: string | null = null
    let targetServerIp: string | null = null
    let didIncrementCount = false

    try {
      // 2. Find a server in the pool with available capacity
      const poolServers = await prisma.server.findMany({
        where: { status: "active" },
        orderBy: { containerCount: "desc" }, // pack densely — fill existing servers first
      })
      const poolServer = poolServers.find(s => s.containerCount < s.capacityLimit) ?? null

      if (poolServer) {
        // 3a. Reuse existing server
        targetServerDbId = poolServer.id
        targetServerIp = poolServer.ip
        console.log(`Reusing server ${poolServer.id} (${poolServer.ip}) — ${poolServer.containerCount}/${poolServer.capacityLimit} slots used`)
      } else {
        // 3b. No capacity — spin up a new Hetzner server
        isNewServer = true
        const serverName = `birdbot-pool-${Date.now()}`
        console.log(`Pool full. Creating new Hetzner server: ${serverName}`)

        const { id: hetznerServerId, ip } = await hetznerCreateServer(serverName)
        newHetznerServerId = hetznerServerId
        targetServerIp = ip
        console.log(`Server created: id=${hetznerServerId} ip=${ip}`)

        // Wait for Hetzner to boot it
        await hetznerPollRunning(hetznerServerId)
        console.log(`Server ${hetznerServerId} is running`)

        // Wait for sshd to accept connections
        await sshWaitReady(ip, privateKey)
        console.log(`SSH ready on ${ip}`)

        // Install Docker
        console.log("Installing Docker...")
        await sshExec(
          ip,
          privateKey,
          "DEBIAN_FRONTEND=noninteractive apt-get update -qq && apt-get install -y docker.io && systemctl enable --now docker"
        )
        console.log("Docker installed")

        // Create Server record in DB
        const newServer = await prisma.server.create({
          data: {
            hetznerServerId,
            ip,
            region: "us-east",
            containerCount: 0,
            capacityLimit: 6,
            status: "active",
          },
        })
        newServerDbId = newServer.id
        targetServerDbId = newServer.id
        console.log(`Server DB record created: ${newServer.id}`)
      }

      // 4. Pull the Docker image
      console.log(`Pulling ${DOCKER_IMAGE}...`)
      await sshExec(targetServerIp!, privateKey, `docker pull ${DOCKER_IMAGE}`)
      console.log("Image pulled")

      // 5. Start the container
      // Container name is unique per agent — used for all subsequent docker commands
      const containerName = `birdbot-${agentId}`
      // Escape double quotes in agent name to prevent shell injection
      const agentNameSafe = agent.name.replace(/"/g, '\\"').replace(/`/g, "\\`").replace(/\$/g, "\\$")
      // Pick a free host port so the gateway can reach this container
      const hostPort = await pickFreePort(targetServerDbId!)
      const dockerRunCmd = [
        "docker run -d",
        `--name ${containerName}`,
        "--memory=512m",
        "--cpus=0.4",
        "--restart=unless-stopped",
        `-p ${hostPort}:18789`,
        `--env AGENT_NAME="${agentNameSafe}"`,
        `--env AGENT_MODEL="${agent.model}"`,
        DOCKER_IMAGE,
      ].join(" ")

      console.log(`Starting container: ${containerName}`)
      await sshExec(targetServerIp!, privateKey, dockerRunCmd)

      // 6. Get the full Docker container ID
      const containerId = await sshExec(
        targetServerIp!,
        privateKey,
        `docker inspect --format='{{.Id}}' ${containerName}`
      )
      console.log(`Container started: ${containerId.slice(0, 12)}`)

      // 7. Update Agent record — mark as provisioning and record location
      await prisma.agent.update({
        where: { id: agentId },
        data: {
          status: "provisioning",
          serverId: targetServerDbId,
          containerId,
          hostPort,
        },
      })

      // 8. Increment containerCount on the Server
      await prisma.server.update({
        where: { id: targetServerDbId! },
        data: { containerCount: { increment: 1 } },
      })
      didIncrementCount = true

      // 9. Poll health via Docker's built-in HEALTHCHECK
      // The Dockerfile HEALTHCHECK polls /health every 30s — wait up to 3 minutes
      console.log("Polling container health...")
      let healthy = false
      for (let i = 0; i < 6; i++) {
        await wait.for({ seconds: 30 })
        try {
          const status = await sshExec(
            targetServerIp!,
            privateKey,
            `docker inspect --format='{{.State.Health.Status}}' ${containerName}`
          )
          console.log(`Health check ${i + 1}/6: ${status}`)
          if (status === "healthy") {
            healthy = true
            break
          }
        } catch (e) {
          console.log(`Health check ${i + 1}/6 failed: ${e instanceof Error ? e.message : e}`)
        }
      }

      if (!healthy) throw new Error("Container did not become healthy within 3 minutes")

      // 10. Mark agent active
      await prisma.agent.update({
        where: { id: agentId },
        data: { status: "active", errorReason: null },
      })

      // 11. Register route with Caddy gateway (no-op if GATEWAY_IP not set yet)
      await registerCaddyRoute(agentId, targetServerIp!, hostPort, privateKey)

      console.log(`Agent ${agentId} is active on ${targetServerIp}:${hostPort}`)
      return { success: true, agentId, serverIp: targetServerIp, hostPort }

    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err)
      console.error(`Provisioning failed for agent ${agentId}: ${reason}`)

      // ─── Rollback ───────────────────────────────────────────────────────────
      try {
        if (targetServerIp) {
          // Remove the container if it was started
          try {
            await sshExec(targetServerIp, privateKey, `docker rm -f birdbot-${agentId}`)
            console.log("Container removed during rollback")
          } catch {
            // Container may not have started — ignore
          }
        }

        if (isNewServer && newHetznerServerId) {
          // New server: destroy the Hetzner server and delete the DB record
          await hetznerDeleteServer(newHetznerServerId)
          console.log(`Hetzner server ${newHetznerServerId} destroyed during rollback`)
          if (newServerDbId) {
            await prisma.server.delete({ where: { id: newServerDbId } })
          }
        } else if (didIncrementCount && targetServerDbId) {
          // Existing server: undo the containerCount increment
          await prisma.server.update({
            where: { id: targetServerDbId },
            data: { containerCount: { decrement: 1 } },
          })
        }
      } catch (rollbackErr) {
        console.error(`Rollback error: ${rollbackErr instanceof Error ? rollbackErr.message : rollbackErr}`)
      }

      // Set agent to error state regardless of rollback outcome
      await prisma.agent.update({
        where: { id: agentId },
        data: { status: "error", errorReason: reason, serverId: null, containerId: null, hostPort: null },
      })

      throw err
    }
  },
})
