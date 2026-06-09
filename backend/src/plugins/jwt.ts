import fp from 'fastify-plugin'
import jwtPlugin from '@fastify/jwt'
import { env } from '@config/env.js'
import type { FastifyInstance } from 'fastify'

export const jwtSetup = fp(async (app: FastifyInstance) => {
  await app.register(jwtPlugin, {
    secret: env.JWT_SECRET,
    sign: {
      algorithm: 'HS256',
      expiresIn: env.JWT_EXPIRES_IN,
    },
  })
})
