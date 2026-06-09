import type { FastifyInstance } from 'fastify'
import { authenticate } from '@middleware/authenticate.js'
import * as controller from './library.controller.js'

export async function libraryRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  app.get('/liked', controller.getLiked)
  app.post('/liked', controller.likeSong)
  app.delete('/liked/:songId', controller.unlikeSong)
  app.get('/liked/:songId', controller.checkLiked)

  app.get('/history', controller.getHistory)
  app.post('/history', controller.addHistory)
  app.delete('/history', controller.clearHistory)

  app.get('/artists', controller.getFollowedArtists)
  app.post('/artists', controller.followArtist)
  app.delete('/artists/:artistId', controller.unfollowArtist)
  app.get('/artists/:artistId', controller.checkFollowing)
}
