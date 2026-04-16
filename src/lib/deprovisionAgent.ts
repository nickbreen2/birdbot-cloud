import { Client } from "ssh2"
import { prisma } from "@/lib/prisma"

const HETZNER_API = "https://api.hetzner.cloud/v1"

// ─── SSH ──────────────────────────────────────────────────────────────────────

function sshExec(ip: string, privateKey: string, command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const conn = new Client()
    let stdout = ""
    let stderr = ""

    conn.on("ready", () => {
      conn.exec(command, (err, stream) => {
        if (err) { conn.end(); reject(err); return }
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
      readyTimeout: 15_000,
      hostVerifier: () => true,
    })
  })
}

// ─── Caddy ────────────────────────────────────────────────────────────────────

async function deregisterCaddyRoute(agentId: string, privateKey: string): Promise<void> {
  const gatewayIp = process.env.GATEWAY_IP
  if (!gatewayIp) {
    console.log("[deprovision] GATEWAY_IP not set — skipping Caddy deregistration")
    return
  }
  try {
    await sshExec(gatewayIp, privateKey, `curl -sf -X DELETE http://localhost:2019/id/route-${agentId} || true`)
    console.log(`[deprovision] Caddy route removed: route-${agentId}`)
  } catch (e) {
    console.warn(`[deprovision] Caddy deregistration failed (non-fatal): ${e instanceof Error ? e.message : e}`)
  }
}

// ─── Core ─────────────────────────────────────────────────────────────────────

export async function deprovisionAgent(agentId: string, clerkUserId: string): Promise<void> {
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, clerkUserId },
  })
  if (!agent) throw new Error("Agent not found")

  // Already offline — idempotent no-op
  if (!agent.serverId || !agent.containerId) {
    await prisma.agent.update({
      where: { id: agentId },
      data: { status: "offline" },
    })
    return
  }

  const server = await prisma.server.findUnique({ where: { id: agent.serverId } })
  if (!server) {
    // Server record gone — just clear the agent
    await prisma.agent.update({
      where: { id: agentId },
      data: { status: "offline", serverId: null, containerId: null, hostPort: null },
    })
    return
  }

  const privateKey = Buffer.from(process.env.HETZNER_SSH_PRIVATE_KEY!, "base64").toString("utf8")

  // Remove container — idempotent (docker rm -f is a no-op if already gone)
  try {
    await sshExec(server.ip, privateKey, `docker rm -f birdbot-${agentId}`)
  } catch (err) {
    console.warn(`[deprovision] docker rm failed for agent ${agentId}: ${err instanceof Error ? err.message : err}`)
  }

  // Deregister Caddy route
  await deregisterCaddyRoute(agentId, privateKey)

  // Decrement containerCount
  const updatedServer = await prisma.server.update({
    where: { id: server.id },
    data: { containerCount: { decrement: 1 } },
  })

  // If the server is draining and now empty — destroy it
  if (updatedServer.status === "draining" && updatedServer.containerCount <= 0) {
    await fetch(`${HETZNER_API}/servers/${server.hetznerServerId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${process.env.HETZNER_API_TOKEN!}` },
    })
    await prisma.server.delete({ where: { id: server.id } })
    console.log(`[deprovision] Server ${server.id} (Hetzner ${server.hetznerServerId}) destroyed — draining and empty`)
  }

  // Mark agent offline
  await prisma.agent.update({
    where: { id: agentId },
    data: { status: "offline", serverId: null, containerId: null, hostPort: null },
  })
}
