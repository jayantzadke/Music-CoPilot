import type { FastifyRequest, FastifyReply } from 'fastify'
import { UnauthorizedError } from '@errors/index.js'

export async function authenticate(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await req.jwtVerify()
  } catch {
    throw new UnauthorizedError('invalid or expired token')
  }

  // check if this token's jti has been blacklisted (happens on logout)
  const payload = req.user as { jti?: string; sub?: string }
  if (payload.jti) {
    const blacklisted = await req.server.redis.get(`session:${payload.sub}:${payload.jti}`)
    if (blacklisted) throw new UnauthorizedError('token has been revoked')
  }
}
