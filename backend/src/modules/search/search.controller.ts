import type { FastifyRequest, FastifyReply } from 'fastify'
import { ValidationError } from '@errors/index.js'
import { MusicApiService } from '@services/music.js'
import { CacheService } from '@services/cache.js'

function getService(req: FastifyRequest) {
  return new MusicApiService(new CacheService(req.server.redis))
}

function parseSearchQuery(req: FastifyRequest) {
  const { query, page, limit } = req.query as { query?: string; page?: string; limit?: string }
  if (!query || query.trim().length < 1) throw new ValidationError('query is required')
  return { query: query.trim(), page: Number(page) || 1, limit: Number(limit) || 20 }
}

export async function searchAll(req: FastifyRequest, reply: FastifyReply) {
  const { query, page, limit } = parseSearchQuery(req)
  const data = await getService(req).searchAll(query, page, limit)
  return reply.send(data)
}

export async function searchSongs(req: FastifyRequest, reply: FastifyReply) {
  const { query, page, limit } = parseSearchQuery(req)
  const data = await getService(req).searchSongs(query, page, limit)
  return reply.send(data)
}

export async function searchAlbums(req: FastifyRequest, reply: FastifyReply) {
  const { query, page } = parseSearchQuery(req)
  const data = await getService(req).searchAlbums(query, page)
  return reply.send(data)
}

export async function searchArtists(req: FastifyRequest, reply: FastifyReply) {
  const { query, page } = parseSearchQuery(req)
  const data = await getService(req).searchArtists(query, page)
  return reply.send(data)
}

export async function searchPlaylists(req: FastifyRequest, reply: FastifyReply) {
  const { query, page } = parseSearchQuery(req)
  const data = await getService(req).searchPlaylists(query, page)
  return reply.send(data)
}
