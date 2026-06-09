import type { FastifyRequest, FastifyReply } from 'fastify'
import { ValidationError } from '@errors/index.js'
import { LikeSongSchema, AddHistorySchema, FollowArtistSchema } from './library.schema.js'
import * as service from './library.service.js'

function userId(req: FastifyRequest) {
  return (req.user as { sub: string }).sub
}

export async function getLiked(req: FastifyRequest, reply: FastifyReply) {
  const { page, limit } = req.query as { page?: string; limit?: string }
  const result = await service.getLikedSongs(userId(req), Number(page) || 1, Number(limit) || 20)
  return reply.send(result)
}

export async function likeSong(req: FastifyRequest, reply: FastifyReply) {
  const parsed = LikeSongSchema.safeParse(req.body)
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? 'invalid input')
  const result = await service.likeSong(userId(req), parsed.data)
  return reply.status(201).send(result)
}

export async function unlikeSong(req: FastifyRequest, reply: FastifyReply) {
  const { songId } = req.params as { songId: string }
  await service.unlikeSong(userId(req), songId)
  return reply.status(204).send()
}

export async function checkLiked(req: FastifyRequest, reply: FastifyReply) {
  const { songId } = req.params as { songId: string }
  const result = await service.isLiked(userId(req), songId)
  return reply.send(result)
}

export async function getHistory(req: FastifyRequest, reply: FastifyReply) {
  const { page, limit } = req.query as { page?: string; limit?: string }
  const result = await service.getPlayHistory(userId(req), Number(page) || 1, Number(limit) || 20)
  return reply.send(result)
}

export async function addHistory(req: FastifyRequest, reply: FastifyReply) {
  const parsed = AddHistorySchema.safeParse(req.body)
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? 'invalid input')
  await service.addPlayHistory(userId(req), parsed.data)
  return reply.status(201).send()
}

export async function clearHistory(req: FastifyRequest, reply: FastifyReply) {
  await service.clearPlayHistory(userId(req))
  return reply.status(204).send()
}

export async function getFollowedArtists(req: FastifyRequest, reply: FastifyReply) {
  const { page, limit } = req.query as { page?: string; limit?: string }
  const result = await service.getFollowedArtists(userId(req), Number(page) || 1, Number(limit) || 20)
  return reply.send(result)
}

export async function followArtist(req: FastifyRequest, reply: FastifyReply) {
  const parsed = FollowArtistSchema.safeParse(req.body)
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? 'invalid input')
  const result = await service.followArtist(userId(req), parsed.data)
  return reply.status(201).send(result)
}

export async function unfollowArtist(req: FastifyRequest, reply: FastifyReply) {
  const { artistId } = req.params as { artistId: string }
  await service.unfollowArtist(userId(req), artistId)
  return reply.status(204).send()
}

export async function checkFollowing(req: FastifyRequest, reply: FastifyReply) {
  const { artistId } = req.params as { artistId: string }
  const result = await service.isFollowing(userId(req), artistId)
  return reply.send(result)
}
