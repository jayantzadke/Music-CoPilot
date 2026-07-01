import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { env } from '@config/env.js'

// neon free tier only gives 5 connections, be conservative in dev
export const sql = postgres(env.DATABASE_URL ?? '', {
  max: env.NODE_ENV === 'production' ? 10 : 3,
})

export const db = drizzle(sql)
