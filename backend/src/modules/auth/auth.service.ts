import bcrypt from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import {
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  createRefreshToken,
  findActiveRefreshTokensByUser,
  revokeRefreshToken,
  revokeAllUserTokens,
} from './auth.repository.js'
import { ConflictError, UnauthorizedError, NotFoundError } from '@errors/index.js'
import { generateRefreshToken, hashToken, verifyToken, getTokenExpiry } from '@utils/token.js'
import { env } from '@config/env.js'
import type { RegisterInput, LoginInput, ChangePasswordInput, UpdateProfileInput } from './auth.schema.js'
import type { User } from '@db/schema/users.js'

const BCRYPT_ROUNDS = 12

// strips password hash before sending to client — never expose this
export function toSafeUser(user: User) {
  const { passwordHash: _, ...safe } = user
  return safe
}

export async function register(app: FastifyInstance, input: RegisterInput) {
  const existing = await findUserByEmail(input.email)
  if (existing) throw new ConflictError(`email already in use`)

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)

  const user = await createUser({
    email: input.email.toLowerCase(),
    passwordHash,
    displayName: input.displayName,
    provider: 'local',
  })

  const { accessToken, refreshToken, tokenId } = await issueTokens(app, user)
  return { user: toSafeUser(user), accessToken, refreshToken, tokenId }
}

export async function login(app: FastifyInstance, input: LoginInput) {
  const user = await findUserByEmail(input.email)

  // same error message for wrong email or wrong password — don't leak which one
  if (!user || !user.passwordHash) throw new UnauthorizedError('invalid credentials')

  const passwordOk = await bcrypt.compare(input.password, user.passwordHash)
  if (!passwordOk) throw new UnauthorizedError('invalid credentials')

  const { accessToken, refreshToken, tokenId } = await issueTokens(app, user)
  return { user: toSafeUser(user), accessToken, refreshToken, tokenId }
}

export async function refreshAccessToken(app: FastifyInstance, userId: string, rawToken: string) {
  const activeTokens = await findActiveRefreshTokensByUser(userId)

  // find the matching token by comparing hashes
  let matchedToken = null
  for (const t of activeTokens) {
    if (await verifyToken(rawToken, t.tokenHash)) {
      matchedToken = t
      break
    }
  }

  if (!matchedToken) throw new UnauthorizedError('refresh token not found or revoked')
  if (matchedToken.expiresAt < new Date()) throw new UnauthorizedError('refresh token expired')

  const user = await findUserById(userId)
  if (!user) throw new NotFoundError(`user ${userId} not found`)

  // rotate — revoke old, issue new
  await revokeRefreshToken(matchedToken.id)
  const { accessToken, refreshToken, tokenId } = await issueTokens(app, user)
  return { accessToken, refreshToken, tokenId }
}

export async function logout(app: FastifyInstance, userId: string, jti: string, tokenId: string) {
  await revokeRefreshToken(tokenId)

  // add jti to redis blacklist so access token can't be used even before expiry
  const remainingMs = 15 * 60 * 1000 // access token max life is 15min
  await app.redis.setex(`session:${userId}:${jti}`, Math.ceil(remainingMs / 1000), '1')
}

export async function changePassword(
  app: FastifyInstance,
  userId: string,
  input: ChangePasswordInput,
) {
  const user = await findUserById(userId)
  if (!user || !user.passwordHash) throw new NotFoundError('user not found')

  const currentOk = await bcrypt.compare(input.currentPassword, user.passwordHash)
  if (!currentOk) throw new UnauthorizedError('current password is incorrect')

  const newHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS)
  await updateUser(userId, { passwordHash: newHash })

  // revoke all sessions so other devices get logged out
  await revokeAllUserTokens(userId)
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  // strip undefined keys to satisfy exactOptionalPropertyTypes
  const data = Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined),
  ) as Partial<User>
  const user = await updateUser(userId, data)
  return toSafeUser(user)
}

async function issueTokens(app: FastifyInstance, user: User) {
  const accessToken = app.jwt.sign({ sub: user.id, email: user.email })

  const rawRefreshToken = generateRefreshToken()
  const tokenHash = await hashToken(rawRefreshToken)
  const expiresAt = getTokenExpiry(env.REFRESH_TOKEN_EXPIRES_IN)

  const stored = await createRefreshToken({
    userId: user.id,
    tokenHash,
    expiresAt,
  })

  return { accessToken, refreshToken: rawRefreshToken, tokenId: stored.id }
}
