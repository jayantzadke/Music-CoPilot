import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

import { redisPlugin } from '@plugins/redis.js'
import { rateLimitPlugin } from '@plugins/rate-limit.js'
import { authRoutes } from '@modules/auth/auth.routes.js'
import { usersRoutes } from '@modules/users/users.routes.js'
import { musicRoutes } from '@modules/music/music.routes.js'
import { searchRoutes } from '@modules/search/search.routes.js'
import { libraryRoutes } from '@modules/library/library.routes.js'
import { AppError } from '@errors/index.js'
import { env } from '@config/env.js'

export async function buildServer(): Promise<FastifyInstance> {
  const isProd = env.NODE_ENV === 'production'

  const app = Fastify({
    // pino-pretty transport doesn't resolve cleanly under tsx on Windows — use plain logger in dev
    logger: isProd
      ? true
      : { level: 'info' },
    bodyLimit: 1_048_576,
  })

  await app.register(cors, {
    origin: isProd ? (env.ALLOWED_ORIGINS ?? true) : true,
    credentials: true,
  })

  await app.register(cookie)
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { algorithm: 'HS256', expiresIn: env.JWT_EXPIRES_IN },
  })

  await app.register(redisPlugin)
  await app.register(rateLimitPlugin)

  app.setErrorHandler((error: Error & { statusCode?: number; code?: string }, req: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof AppError) {
      req.log.warn({ err: error, code: error.code }, error.message)
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        code: error.code,
        message: error.message,
      })
    }

    if (error.statusCode != null && error.statusCode < 500) {
      req.log.warn({ err: error }, error.message)
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        code: error.code ?? 'VALIDATION_ERROR',
        message: error.message,
      })
    }

    req.log.error({ err: error }, 'unhandled error')
    return reply.status(500).send({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: isProd ? 'something went wrong' : error.message,
    })
  })

  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(usersRoutes, { prefix: '/api/users' })
  await app.register(musicRoutes, { prefix: '/api/music' })
  await app.register(searchRoutes, { prefix: '/api/search' })
  await app.register(libraryRoutes, { prefix: '/api/library' })

  return app
}

async function start(): Promise<void> {
  const app = await buildServer()
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

process.on('unhandledRejection', (reason) => {
  console.error('unhandled rejection:', reason)
  process.exit(1)
})

process.on('uncaughtException', (err) => {
  console.error('uncaught exception:', err)
  process.exit(1)
})

start()
