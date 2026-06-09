// dev-only entry point — no db, no redis, no auth
// just a music api proxy so you can smoke test the frontend
import Fastify from 'fastify'
import cors from '@fastify/cors'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { AppError } from '@errors/index.js'

const PORT = Number(process.env['PORT'] ?? 3001)
const MUSIC_API_URL = process.env['MUSIC_API_URL'] ?? 'https://saavn.dev/api'

// simple in-memory cache so we don't hammer saavn.dev
const cache = new Map<string, { data: unknown; expiresAt: number }>()

async function cachedFetch(path: string, ttlSeconds: number) {
  const key = path
  const hit = cache.get(key)
  if (hit && hit.expiresAt > Date.now()) return hit.data

  const res = await fetch(`${MUSIC_API_URL}${path}`)
  if (!res.ok) throw new AppError(`saavn returned ${res.status} for ${path}`, 'EXTERNAL_API', 502)

  const data = await res.json()
  cache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 })
  return data
}

const app = Fastify({
  logger: true,
})

await app.register(cors, { origin: true, credentials: true })

app.setErrorHandler((error: Error & { statusCode?: number; code?: string }, _req: FastifyRequest, reply: FastifyReply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({ statusCode: error.statusCode, code: error.code, message: error.message })
  }
  return reply.status(500).send({ statusCode: 500, code: 'INTERNAL_ERROR', message: error.message })
})

// health check
app.get('/health', async () => ({ ok: true, mode: 'dev-no-auth' }))

// search routes
app.get('/api/search/all', async (req, reply) => {
  const { query, page = '1', limit = '20' } = req.query as Record<string, string>
  if (!query) return reply.status(400).send({ message: 'query is required' })
  const data = await cachedFetch(`/search/all?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, 300)
  return reply.send(data)
})

app.get('/api/search/songs', async (req, reply) => {
  const { query, page = '1', limit = '20' } = req.query as Record<string, string>
  if (!query) return reply.status(400).send({ message: 'query is required' })
  const data = await cachedFetch(`/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, 300)
  return reply.send(data)
})

app.get('/api/search/albums', async (req, reply) => {
  const { query, page = '1' } = req.query as Record<string, string>
  if (!query) return reply.status(400).send({ message: 'query is required' })
  const data = await cachedFetch(`/search/albums?query=${encodeURIComponent(query)}&page=${page}`, 300)
  return reply.send(data)
})

app.get('/api/search/artists', async (req, reply) => {
  const { query, page = '1' } = req.query as Record<string, string>
  if (!query) return reply.status(400).send({ message: 'query is required' })
  const data = await cachedFetch(`/search/artists?query=${encodeURIComponent(query)}&page=${page}`, 300)
  return reply.send(data)
})

app.get('/api/search/playlists', async (req, reply) => {
  const { query, page = '1' } = req.query as Record<string, string>
  if (!query) return reply.status(400).send({ message: 'query is required' })
  const data = await cachedFetch(`/search/playlists?query=${encodeURIComponent(query)}&page=${page}`, 300)
  return reply.send(data)
})

// music routes
app.get('/api/music/songs/:id', async (req, reply) => {
  const { id } = req.params as { id: string }
  const data = await cachedFetch(`/songs/${id}`, 3600)
  return reply.send(data)
})

app.get('/api/music/songs/:id/suggestions', async (req, reply) => {
  const { id } = req.params as { id: string }
  const { limit = '10' } = req.query as Record<string, string>
  const data = await cachedFetch(`/songs/${id}/suggestions?limit=${limit}`, 3600)
  return reply.send(data)
})

app.get('/api/music/albums/:id', async (req, reply) => {
  const { id } = req.params as { id: string }
  const data = await cachedFetch(`/albums/${id}`, 3600)
  return reply.send(data)
})

app.get('/api/music/artists/:id', async (req, reply) => {
  const { id } = req.params as { id: string }
  const data = await cachedFetch(`/artists/${id}`, 1800)
  return reply.send(data)
})

app.get('/api/music/artists/:id/songs', async (req, reply) => {
  const { id } = req.params as { id: string }
  const { page = '1' } = req.query as Record<string, string>
  const data = await cachedFetch(`/artists/${id}/songs?page=${page}&sortBy=popularity`, 1800)
  return reply.send(data)
})

app.get('/api/music/artists/:id/albums', async (req, reply) => {
  const { id } = req.params as { id: string }
  const { page = '1' } = req.query as Record<string, string>
  const data = await cachedFetch(`/artists/${id}/albums?page=${page}`, 1800)
  return reply.send(data)
})

app.get('/api/music/playlists/:id', async (req, reply) => {
  const { id } = req.params as { id: string }
  const data = await cachedFetch(`/playlists/${id}`, 3600)
  return reply.send(data)
})

app.get('/api/music/modules', async (req, reply) => {
  const { language = 'hindi' } = req.query as Record<string, string>
  const allowed = ['hindi', 'english', 'tamil', 'telugu', 'punjabi']
  const lang = allowed.includes(language) ? language : 'hindi'
  const data = await cachedFetch(`/modules?language=${lang}`, 900)
  return reply.send(data)
})

try {
  await app.listen({ port: PORT, host: '0.0.0.0' })
  console.log(`\n  dev server running on http://localhost:${PORT}`)
  console.log('  mode: no-auth, no-db, music api proxy only\n')
} catch (err) {
  console.error(err)
  process.exit(1)
}
