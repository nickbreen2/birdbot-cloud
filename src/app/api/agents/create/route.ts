// src/app/api/agents/create/route.ts
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import type { CreateAgentPayload } from "@/types/wizard"
import { MODELS, FOCUS_AREAS, CHANNELS } from "@/types/wizard"
import { prisma } from "@/lib/prisma"

const ALLOWED_MODELS = new Set<string>(MODELS.map((m) => m.id))
const ALLOWED_FOCUS_AREAS = new Set<string>(FOCUS_AREAS.map((f) => f.id))
const ALLOWED_CHANNELS = new Set<string>(CHANNELS.map((c) => c.id))

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = (await request.json()) as Partial<CreateAgentPayload>

    if (!payload.name || payload.name.trim().length < 2) {
      return NextResponse.json(
        { error: "Agent name must be at least 2 characters" },
        { status: 400 }
      )
    }
    if (payload.name.trim().length > 50) {
      return NextResponse.json(
        { error: "Agent name must be 50 characters or fewer" },
        { status: 400 }
      )
    }
    if (payload.model && !ALLOWED_MODELS.has(payload.model)) {
      return NextResponse.json({ error: "Invalid model" }, { status: 400 })
    }
    if (!payload.focusAreas || payload.focusAreas.length === 0) {
      return NextResponse.json(
        { error: "At least one focus area is required" },
        { status: 400 }
      )
    }
    if (payload.focusAreas.some((f) => !ALLOWED_FOCUS_AREAS.has(f))) {
      return NextResponse.json({ error: "Invalid focus area" }, { status: 400 })
    }
    if (payload.channels && payload.channels.some((c) => !ALLOWED_CHANNELS.has(c))) {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 })
    }

    const agentData: CreateAgentPayload = {
      name: payload.name.trim(),
      model: payload.model ?? "kimi-k2.5",
      traits: payload.traits ?? {
        professional: 0,
        friendly: 0,
        unhinged: 0,
        creative: 0,
        direct: 0,
        humor: 0,
        analytical: 0,
        supportive: 0,
      },
      focusAreas: payload.focusAreas,
      channels: payload.channels ?? ["web"],
      createdAt: new Date().toISOString(),
    }

    // 1. Save to database — update existing agent or create new one
    if (payload.id) {
      const result = await prisma.agent.updateMany({
        where: { id: payload.id, clerkUserId: userId },
        data: {
          name: agentData.name,
          model: agentData.model,
          traits: agentData.traits,
          focusAreas: agentData.focusAreas,
          channels: agentData.channels,
        },
      })
      if (result.count === 0) {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 })
      }
    } else {
      await prisma.agent.create({
        data: {
          clerkUserId: userId,
          name: agentData.name,
          model: agentData.model,
          traits: agentData.traits,
          focusAreas: agentData.focusAreas,
          channels: agentData.channels,
          status: "incubating",
        },
      })
    }

    // 2. Notify via webhook (fire-and-forget — never blocks the response)
    const webhookUrl = process.env.ADMIN_WEBHOOK_URL
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "agent.created",
          userId,
          agent: agentData,
          timestamp: agentData.createdAt,
        }),
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[/api/agents/create] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
