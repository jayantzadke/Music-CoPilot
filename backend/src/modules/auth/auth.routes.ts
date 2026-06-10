import type { FastifyInstance } from 'fastify'
import { authenticate } from '@middleware/authenticate.js'
import * as controller from './auth.controller.js'

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', controller.register)
  app.post('/login', { config: { rateLimit: { max: 5, timeWindow: 60_000 } } }, controller.login)
  app.post('/google', controller.googleAuth)
  app.post('/refresh', controller.refresh)
  app.post('/logout', { preHandler: [authenticate] }, controller.logout)
  app.get('/me', { preHandler: [authenticate] }, controller.getMe)
  app.patch('/me', { preHandler: [authenticate] }, controller.patchMe)
  app.post('/change-password', { preHandler: [authenticate] }, controller.changePassword)
}
