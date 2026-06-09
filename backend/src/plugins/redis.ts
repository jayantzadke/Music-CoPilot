import fp from 'fastify-plugin'
import { Redis } from 'ioredis'
import { env } from '@config/env.js'
import type { FastifyInstance } from 'fastify'

// stub that silently no-ops — used when redis isn't configured
class NoopRedis {
  async get() { return null }
  async set() { return 'OK' }
  async setex() { return 'OK' }
  async del() { return 0 }
  async exists() { return 0 }
  async quit() {}
  on() { return this }
}

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis
  }
}

export const redisPlugin = fp(async (app: FastifyInstance) => {
  if (!env.REDIS_URL) {
    app.log.warn('REDIS_URL not set — running without cache')
    app.decorate('redis', new NoopRedis() as unknown as Redis)
    return
  }

  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    enableOfflineQueue: false,
  })

  redis.on('error', (err: Error) => {
    app.log.error({ err }, 'redis connection error')
  })

  try {
    await redis.connect()
    app.decorate('redis', redis)
    app.addHook('onClose', async () => {
      await redis.quit()
    })
  } catch (err) {
    app.log.warn({ err }, 'redis unavailable — running without cache')
    await redis.quit().catch(() => null)
    app.decorate('redis', new NoopRedis() as unknown as Redis)
  }
})
