import type { FastifyInstance } from 'fastify'
import { optionalAuth } from '@middleware/optional-auth.js'
import * as controller from './search.controller.js'

export async function searchRoutes(app: FastifyInstance) {
  app.addHook('preHandler', optionalAuth)

  app.get('/all', controller.searchAll)
  app.get('/songs', controller.searchSongs)
  app.get('/albums', controller.searchAlbums)
  app.get('/artists', controller.searchArtists)
  app.get('/playlists', controller.searchPlaylists)
}
