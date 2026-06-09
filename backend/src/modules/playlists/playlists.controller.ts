import type { FastifyRequest, FastifyReply } from 'fastify'
import { ValidationError } from '@errors/index.js'
import { CreatePlaylistSchema, UpdatePlaylistSchema, AddSongSchema, ReorderSongSchema } from './playlists.schema.js'
import * as service from './playlists.service.js'

function userId(req: FastifyRequest) {
  return (req.user as { sub: string }).sub
}

export async function listPlaylists(req: FastifyRequest, reply: FastifyReply) {
  const { page, limit } = req.query as { page?: string; limit?: string }
  const result = await service.getUserPlaylists(userId(req), Number(page) || 1, Number(limit) || 20)
  return reply.send(result)
}

export async function createPlaylist(req: FastifyRequest, reply: FastifyReply) {
  const parsed = CreatePlaylistSchema.safeParse(req.body)
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? 'invalid input')
  const playlist = await service.createPlaylist(userId(req), parsed.data)
  return reply.status(201).send(playlist)
}

export async function getPlaylist(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const user = req.user as { sub?: string } | undefined
  const result = await service.getPlaylist(id, user?.sub)
  return reply.send(result)
}

export async function updatePlaylist(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const parsed = UpdatePlaylistSchema.safeParse(req.body)
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? 'invalid input')
  const result = await service.updatePlaylist(id, userId(req), parsed.data)
  return reply.send(result)
}

export async function deletePlaylist(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  await service.deletePlaylist(id, userId(req))
  return reply.status(204).send()
}

export async function addSong(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const parsed = AddSongSchema.safeParse(req.body)
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? 'invalid input')
  const song = await service.addSong(id, userId(req), parsed.data)
  return reply.status(201).send(song)
}

export async function removeSong(req: FastifyRequest, reply: FastifyReply) {
  const { id, songId } = req.params as { id: string; songId: string }
  await service.removeSong(id, userId(req), songId)
  return reply.status(204).send()
}

export async function reorderSong(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const parsed = ReorderSongSchema.safeParse(req.body)
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? 'invalid input')
  await service.reorderSong(id, userId(req), parsed.data)
  return reply.send({ ok: true })
}
