import type { FastifyInstance } from 'fastify'
import { authenticate } from '@middleware/authenticate.js'
import { getMe } from './users.controller.js'

export async function usersRoutes(app: FastifyInstance) {
  app.get('/me', { preHandler: [authenticate] }, getMe)
}
