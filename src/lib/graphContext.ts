import { prisma } from "@/lib/prisma"
import { GoalStatus } from "@/generated/prisma/enums"

export type GraphContext = {
  recentEntities: { name: string; type: string; description?: string }[]
  activeGoals: { name: string; description?: string }[]
  softGoals: { name: string; description?: string }[]
}

export async function getGraphContext(userId: string): Promise<GraphContext> {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

  const [recentEntities, goals] = await Promise.all([
    prisma.entity.findMany({
      where: {
        userId,
        updatedAt: { gte: fourteenDaysAgo },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { name: true, type: true, description: true },
    }),
    prisma.goal.findMany({
      where: {
        userId,
        status: { in: [GoalStatus.active, GoalStatus.pending_confirmation] },
      },
      select: {
        title: true,
        description: true,
        status: true,
      },
    }),
  ])

  return {
    recentEntities: recentEntities.map((e) => ({
      name: e.name,
      type: e.type,
      description: e.description ?? undefined,
    })),
    activeGoals: goals
      .filter((g) => g.status === GoalStatus.active)
      .map((g) => ({ name: g.title, description: g.description ?? undefined })),
    softGoals: goals
      .filter((g) => g.status === GoalStatus.pending_confirmation)
      .map((g) => ({ name: g.title, description: g.description ?? undefined })),
  }
}
