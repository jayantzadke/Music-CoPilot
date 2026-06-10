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

export function toSafeUser(user: User) {
  const { passwordHash: _, ...safe } = user
  return safe
}

export async function register(app: FastifyInstance, input: RegisterInput) {
  const existing = await findUserByEmail(input.email)
  if (existing) throw new ConflictError('email already in use')

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)
  const user = await createUser({
    email: input.email.toLowerCase(),
    passwordHash,
    displayName: input.displayName,
    provider: 'local',
  })

  const tokens = await issueTokens(app, user)
  return { user: toSafeUser(user), ...tokens }
}

export async function login(app: FastifyInstance, input: LoginInput) {
  const user = await findUserByEmail(input.email)
  if (!user || !user.passwordHash) throw new UnauthorizedError('invalid credentials')

  const ok = await bcrypt.compare(input.password, user.passwordHash)
  if (!ok) throw new UnauthorizedError('invalid credentials')

  const tokens = await issueTokens(app, user)
  return { user: toSafeUser(user), ...tokens }
}

export async function googleSignIn(
  app: FastifyInstance,
  input: { email: string; displayName: string; googleId: string; avatarUrl: string | null },
) {
  let user = await findUserByEmail(input.email)

  if (!user) {
    user = await createUser({
      email: input.email.toLowerCase(),
      displayName: input.displayName,
      avatarUrl: input.avatarUrl,
      provider: 'google',
      providerId: input.googleId,
      isVerified: true,
    })
  }

  const tokens = await issueTokens(app, user)
  return { user: toSafeUser(user), ...tokens }
}

export async function refreshAccessToken(app: FastifyInstance, userId: string, rawToken: string) {
  const activeTokens = await findActiveRefreshTokensByUser(userId)

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

  await revokeRefreshToken(matchedToken.id)
  const tokens = await issueTokens(app, user)
  return tokens
}

export async function logout(app: FastifyInstance, userId: string, jti: string, tokenId: string) {
  await revokeRefreshToken(tokenId)
  const remainingMs = 15 * 60 * 1000
  await app.redis.setex(`session:${userId}:${jti}`, Math.ceil(remainingMs / 1000), '1')
}

export async function changePassword(app: FastifyInstance, userId: string, input: ChangePasswordInput) {
  const user = await findUserById(userId)
  if (!user || !user.passwordHash) throw new NotFoundError('user not found')

  const ok = await bcrypt.compare(input.currentPassword, user.passwordHash)
  if (!ok) throw new UnauthorizedError('current password is incorrect')

  const newHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS)
  await updateUser(userId, { passwordHash: newHash })
  await revokeAllUserTokens(userId)
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
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
