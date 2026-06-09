import type { FastifyRequest, FastifyReply } from 'fastify'

// same as authenticate but doesn't reject if token is missing
// used on public music/search routes where we want user context if available
export async function optionalAuth(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return

  try {
    await req.jwtVerify()

    const payload = req.user as { jti?: string; sub?: string }
    if (payload.jti) {
      const blacklisted = await req.server.redis.get(`session:${payload.sub}:${payload.jti}`)
      if (blacklisted) {
        // clear user from request so route handlers treat them as unauthenticated
        ;(req as unknown as Record<string, unknown>).user = undefined
      }
    }
  } catch {
    // token is present but invalid — just ignore it, treat as guest
  }
}
