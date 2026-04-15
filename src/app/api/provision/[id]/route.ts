import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
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

// ─── Hetzner ──────────────────────────────────────────────────────────────────

async function hetznerDeleteServer(hetznerServerId: number): Promise<void> {
  await fetch(`${HETZNER_API}/servers/${hetznerServerId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${process.env.HETZNER_API_TOKEN!}` },
  })
}

// ─── Caddy route management ───────────────────────────────────────────────────

async function deregisterCaddyRoute(agentId: string, privateKey: string): Promise<void> {
  const gatewayIp = process.env.GATEWAY_IP
  if (!gatewayIp) {
    console.log("[deprovision] GATEWAY_IP not set — skipping Caddy deregistration")
    return
  }
  const cmd = `curl -sf -X DELETE http://localhost:2019/id/route-${agentId} || true`
  try {
    await sshExec(gatewayIp, privateKey, cmd)
    console.log(`[deprovision] Caddy route removed: route-${agentId}`)
  } catch (e) {
    console.warn(`[deprovision] Caddy deregistration failed (non-fatal): ${e instanceof Error ? e.message : e}`)
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id: agentId } = await params

    // 1. Look up agent and verify ownership
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, clerkUserId: userId },
    })
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 })

    // 2. If already offline/unprovisioned — idempotent success
    if (!agent.serverId || !agent.containerId) {
      await prisma.agent.update({
        where: { id: agentId },
        data: { status: "offline" },
      })
      return NextResponse.json({ ok: true })
    }

    // 3. Look up the pool server
    const server = await prisma.server.findUnique({ where: { id: agent.serverId } })
    if (!server) {
      // Server record gone — just clear the agent
      await prisma.agent.update({
        where: { id: agentId },
        data: { status: "offline", serverId: null, containerId: null },
      })
      return NextResponse.json({ ok: true })
    }

    const privateKey = Buffer.from(
      process.env.HETZNER_SSH_PRIVATE_KEY!,
      "base64"
    ).toString("utf8")

    // 4. Remove the container — idempotent (docker rm -f is a no-op if container is gone)
    try {
      await sshExec(server.ip, privateKey, `docker rm -f birdbot-${agentId}`)
    } catch (err) {
      // Log but don't fail — container may already be gone
      console.warn(`[deprovision] docker rm failed for agent ${agentId}: ${err instanceof Error ? err.message : err}`)
    }

    // 4b. Deregister Caddy route (no-op if GATEWAY_IP not set)
    await deregisterCaddyRoute(agentId, privateKey)

    // 5. Decrement containerCount
    const updatedServer = await prisma.server.update({
      where: { id: server.id },
      data: { containerCount: { decrement: 1 } },
    })

    // 6. If the server is draining and now empty — destroy it
    if (updatedServer.status === "draining" && updatedServer.containerCount <= 0) {
      await hetznerDeleteServer(server.hetznerServerId)
      await prisma.server.delete({ where: { id: server.id } })
      console.log(`[deprovision] Server ${server.id} (Hetzner ${server.hetznerServerId}) destroyed — was draining and is now empty`)
    }

    // 7. Mark agent offline
    await prisma.agent.update({
      where: { id: agentId },
      data: { status: "offline", serverId: null, containerId: null, hostPort: null },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[DELETE /api/provision/[id]] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
