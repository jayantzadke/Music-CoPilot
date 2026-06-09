import { eq, and, lt, isNull } from 'drizzle-orm'
import { db } from '@config/db.js'
import { users, refreshTokens } from '@db/schema/index.js'
import type { User } from '@db/schema/users.js'
import type { NewRefreshToken, RefreshToken } from '@db/schema/refresh_tokens.js'

type NewUser = typeof users.$inferInsert

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.email, email.toLowerCase()))
  return (result[0] as User | undefined) ?? null
}

export async function findUserById(id: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.id, id))
  return (result[0] as User | undefined) ?? null
}

export async function createUser(data: NewUser): Promise<User> {
  const result = await db.insert(users).values(data).returning()
  if (!result[0]) throw new Error('user insert returned nothing')
  return result[0] as User
}

export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  const result = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning()
  if (!result[0]) throw new Error(`user ${id} not found after update`)
  return result[0] as User
}

export async function createRefreshToken(data: NewRefreshToken): Promise<RefreshToken> {
  const result = await db.insert(refreshTokens).values(data).returning()
  if (!result[0]) throw new Error('refresh token insert returned nothing')
  return result[0] as RefreshToken
}

export async function findActiveRefreshTokensByUser(userId: string): Promise<RefreshToken[]> {
  const result = await db
    .select()
    .from(refreshTokens)
    .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)))
  return result as RefreshToken[]
}

export async function revokeRefreshToken(id: string): Promise<void> {
  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, id))
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)))
}

export async function findRefreshTokensByUser(userId: string): Promise<RefreshToken[]> {
  const result = await db.select().from(refreshTokens).where(eq(refreshTokens.userId, userId))
  return result as RefreshToken[]
}

export async function deleteExpiredTokens(): Promise<void> {
  await db.delete(refreshTokens).where(lt(refreshTokens.expiresAt, new Date()))
}
