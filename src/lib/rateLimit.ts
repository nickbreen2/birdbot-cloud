import { prisma } from "@/lib/prisma"

/**
 * DB-backed sliding-window rate limiter using RateLimitBucket.
 * Returns true if the request is allowed, false if rate limited.
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowMs)
  const count = await prisma.rateLimitBucket.count({
    where: { key, createdAt: { gt: windowStart } },
  })
  if (count >= maxRequests) return false
  await prisma.rateLimitBucket.create({ data: { key } })
  return true
}
