import { eq } from 'drizzle-orm'
import { db } from '@config/db.js'
import { users } from '@db/schema/index.js'
import type { User } from '@db/schema/users.js'

export async function findUserById(id: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.id, id))
  return (result[0] as User | undefined) ?? null
}

export async function updateProfile(id: string, data: Partial<User>): Promise<User> {
  const result = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning()
  if (!result[0]) throw new Error(`user ${id} not found`)
  return result[0] as User
}
