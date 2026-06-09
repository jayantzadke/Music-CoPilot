import type { FastifyInstance } from 'fastify'
import { optionalAuth } from '@middleware/optional-auth.js'
import * as controller from './music.controller.js'

export async function musicRoutes(app: FastifyInstance) {
  app.addHook('preHandler', optionalAuth)

  app.get('/songs/:id', controller.getSong)
  app.get('/songs/:id/suggestions', controller.getSongSuggestions)
  app.get('/songs/:id/lyrics', controller.getSongLyrics)
  app.get('/albums/:id', controller.getAlbum)
  app.get('/artists/:id', controller.getArtist)
  app.get('/artists/:id/songs', controller.getArtistSongs)
  app.get('/artists/:id/albums', controller.getArtistAlbums)
  app.get('/playlists/:id', controller.getPlaylist)
  app.get('/modules', controller.getModules)
}
