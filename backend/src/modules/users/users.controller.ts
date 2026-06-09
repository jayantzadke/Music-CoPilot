import type { FastifyRequest, FastifyReply } from 'fastify'
import { getProfile } from './users.service.js'

export async function getMe(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user as { sub: string }
  const profile = await getProfile(user.sub)
  return reply.send({ user: profile })
}
