import { NotFoundError } from '@errors/index.js'
import { findUserById, updateProfile } from './users.repository.js'
import { toSafeUser } from '../auth/auth.service.js'
import type { UpdateProfileInput } from '../auth/auth.schema.js'

export async function getProfile(userId: string) {
  const user = await findUserById(userId)
  if (!user) throw new NotFoundError(`user not found`)
  return toSafeUser(user)
}

export async function updateUserProfile(userId: string, data: UpdateProfileInput) {
  await getProfile(userId)
  const stripped = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined),
  ) as Partial<import('@db/schema/users.js').User>
  const updated = await updateProfile(userId, stripped)
  return toSafeUser(updated)
}
