import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic()

function buildSystemPrompt(project: string, brief: string | null): string {
  if (!brief) {
    return `You are BirdBot, an AI assistant for the project "${project}". No session history has been recorded yet for this project. Let the user know there isn't much context available yet, and encourage them to start using BirdBot in their coding sessions to build up the project memory.`
  }

  return `You are BirdBot, an AI assistant with deep knowledge of the "${project}" project. You have access to a synthesized brief built from all recorded development sessions and architectural decisions.

PROJECT BRIEF:
${brief}

Answer questions about this project concisely and accurately. Be direct — you know this project well. If asked something that isn't covered by the brief, say so clearly rather than guessing.`
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ project: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { project: encodedProject } = await params
  const project = decodeURIComponent(encodedProject)

  const body = await request.json() as { message?: string; history?: { role: "user" | "assistant"; content: string }[] }
  if (!body.message?.trim()) {
    return NextResponse.json({ error: "message required" }, { status: 400 })
  }

  const connection = await prisma.mcpConnection.findUnique({ where: { clerkUserId: userId } })
  if (!connection) {
    return NextResponse.json({ error: "No MCP connection found" }, { status: 404 })
  }

  const briefRecord = await prisma.projectBrief.findUnique({
    where: { userToken_project: { userToken: connection.userToken, project } },
  })

  const messages: Anthropic.MessageParam[] = [
    ...(body.history ?? []),
    { role: "user", content: body.message },
  ]

  const stream = anthropic.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: buildSystemPrompt(project, briefRecord?.brief ?? null),
    messages,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
