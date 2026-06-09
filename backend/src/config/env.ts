import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  // optional for MVP — server runs without db/redis
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  JWT_SECRET: z.string().min(32).default('dev-secret-change-in-production-min-32chars'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  MUSIC_API_URL: z.string().url().default('https://saavn.sumit.co'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  ALLOWED_ORIGINS: z.string().optional(),
})

const result = schema.safeParse(process.env)

if (!result.success) {
  const issues = result.error.issues.map(i => `  ${i.path.join('.')}: ${i.message}`)
  console.error('invalid environment config:\n' + issues.join('\n'))
  process.exit(1)
}

export const env = result.data
export type Env = typeof env
