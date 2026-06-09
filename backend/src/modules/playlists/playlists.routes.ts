import type { FastifyInstance } from 'fastify'
import { authenticate } from '@middleware/authenticate.js'
import { optionalAuth } from '@middleware/optional-auth.js'
import * as controller from './playlists.controller.js'

export async function playlistsRoutes(app: FastifyInstance) {
  // public read — uses optional auth so owners see edit options
  app.get('/:id', { preHandler: [optionalAuth] }, controller.getPlaylist)

  // everything else requires auth
  app.get('/', { preHandler: [authenticate] }, controller.listPlaylists)
  app.post('/', { preHandler: [authenticate] }, controller.createPlaylist)
  app.patch('/:id', { preHandler: [authenticate] }, controller.updatePlaylist)
  app.delete('/:id', { preHandler: [authenticate] }, controller.deletePlaylist)
  app.post('/:id/songs', { preHandler: [authenticate] }, controller.addSong)
  app.delete('/:id/songs/:songId', { preHandler: [authenticate] }, controller.removeSong)
  app.patch('/:id/songs/reorder', { preHandler: [authenticate] }, controller.reorderSong)
}
