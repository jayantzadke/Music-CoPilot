import type { FastifyRequest, FastifyReply } from 'fastify'
import { MusicApiService } from '@services/music.js'
import { CacheService } from '@services/cache.js'

function getService(req: FastifyRequest) {
  return new MusicApiService(new CacheService(req.server.redis))
}

export async function getSong(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const data = await getService(req).getSong(id)
  return reply.send(data)
}

export async function getSongSuggestions(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const { limit } = req.query as { limit?: string }
  const data = await getService(req).getSongSuggestions(id, Number(limit) || 10)
  return reply.send(data)
}

export async function getAlbum(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const data = await getService(req).getAlbum(id)
  return reply.send(data)
}

export async function getArtist(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const data = await getService(req).getArtist(id)
  return reply.send(data)
}

export async function getArtistSongs(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const { page } = req.query as { page?: string }
  const data = await getService(req).getArtistSongs(id, Number(page) || 1)
  return reply.send(data)
}

export async function getArtistAlbums(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const { page } = req.query as { page?: string }
  const data = await getService(req).getArtistAlbums(id, Number(page) || 1)
  return reply.send(data)
}

export async function getPlaylist(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const data = await getService(req).getPlaylist(id)
  return reply.send(data)
}

export async function getModules(req: FastifyRequest, reply: FastifyReply) {
  const { languages } = req.query as { languages?: string }
  const lang = (languages ?? 'hindi').split(',')[0]?.trim() ?? 'hindi'

  // no modules endpoint exists — build a home page from search results
  const [songs, albums, artists] = await Promise.all([
    getService(req).searchSongs(lang, 1, 20),
    getService(req).searchAlbums(lang, 1, 10),
    getService(req).searchArtists(lang, 1, 10),
  ])

  return reply.send({
    trending: { songs: (songs as Record<string, unknown>)?.results ?? [] },
    newReleases: { albums: (albums as Record<string, unknown>)?.results ?? [] },
    topArtists: { artists: (artists as Record<string, unknown>)?.results ?? [] },
  })
}

export async function getSongLyrics(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const data = await getService(req).getLyrics(id)
  return reply.send(data)
}
