import type { FastifyRequest, FastifyReply } from 'fastify'
import { RegisterSchema, LoginSchema, ChangePasswordSchema, UpdateProfileSchema } from './auth.schema.js'
import { ValidationError, UnauthorizedError } from '@errors/index.js'
import * as authService from './auth.service.js'

const REFRESH_TOKEN_COOKIE = 'refreshToken'
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60

function setCookies(reply: FastifyReply, refreshToken: string, userId: string, tokenId: string) {
  const isProd = process.env['NODE_ENV'] === 'production'
  const opts = { httpOnly: true, secure: isProd, sameSite: 'strict' as const, path: '/' }
  reply.setCookie(REFRESH_TOKEN_COOKIE, refreshToken, { ...opts, maxAge: REFRESH_COOKIE_MAX_AGE })
  reply.setCookie('userId', userId, { ...opts, maxAge: REFRESH_COOKIE_MAX_AGE })
  reply.setCookie('tokenId', tokenId, { ...opts, maxAge: REFRESH_COOKIE_MAX_AGE })
}

export async function register(req: FastifyRequest, reply: FastifyReply) {
  const parsed = RegisterSchema.safeParse(req.body)
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? 'invalid input')

  const { user, accessToken, refreshToken, tokenId } = await authService.register(req.server, parsed.data)
  setCookies(reply, refreshToken, user.id, tokenId)
  return reply.status(201).send({ user, accessToken })
}

export async function login(req: FastifyRequest, reply: FastifyReply) {
  const parsed = LoginSchema.safeParse(req.body)
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? 'invalid input')

  const { user, accessToken, refreshToken, tokenId } = await authService.login(req.server, parsed.data)
  setCookies(reply, refreshToken, user.id, tokenId)
  return reply.send({ user, accessToken })
}

export async function googleAuth(req: FastifyRequest, reply: FastifyReply) {
  const { email, displayName, googleId, avatar } = req.body as {
    email: string
    displayName: string
    googleId: string
    avatar?: string
  }
  if (!email || !googleId) throw new ValidationError('email and googleId required')

  const { user, accessToken, refreshToken, tokenId } = await authService.googleSignIn(req.server, {
    email,
    displayName,
    googleId,
    avatarUrl: avatar ?? null,
  })
  setCookies(reply, refreshToken, user.id, tokenId)
  return reply.send({ user, accessToken })
}

export async function refresh(req: FastifyRequest, reply: FastifyReply) {
  const rawToken = req.cookies[REFRESH_TOKEN_COOKIE]
  if (!rawToken) throw new UnauthorizedError('no refresh token')

  const userIdCookie = req.cookies['userId']
  if (!userIdCookie) throw new UnauthorizedError('missing user context')

  const { accessToken, refreshToken, tokenId } = await authService.refreshAccessToken(
    req.server,
    userIdCookie,
    rawToken,
  )
  setCookies(reply, refreshToken, userIdCookie, tokenId)
  return reply.send({ accessToken })
}

export async function logout(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user as { sub: string; jti?: string } | undefined
  const tokenId = req.cookies['tokenId']

  if (user && tokenId) {
    await authService.logout(req.server, user.sub, user.jti ?? '', tokenId)
  }

  reply.clearCookie(REFRESH_TOKEN_COOKIE)
  reply.clearCookie('userId')
  reply.clearCookie('tokenId')

  return reply.send({ ok: true })
}

export async function getMe(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user as { sub: string }
  const { findUserById } = await import('../users/users.repository.js')

  const found = await findUserById(user.sub)
  if (!found) throw new UnauthorizedError('user not found')

  return reply.send({ user: authService.toSafeUser(found) })
}

export async function patchMe(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user as { sub: string }
  const parsed = UpdateProfileSchema.safeParse(req.body)
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? 'invalid input')

  const updated = await authService.updateProfile(user.sub, parsed.data)
  return reply.send({ user: updated })
}

export async function changePassword(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user as { sub: string }
  const parsed = ChangePasswordSchema.safeParse(req.body)
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? 'invalid input')

  await authService.changePassword(req.server, user.sub, parsed.data)
  return reply.send({ ok: true })
}
