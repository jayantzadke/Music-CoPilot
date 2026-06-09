import { ConflictError, NotFoundError } from '@errors/index.js'
import * as repo from './library.repository.js'
import { parsePagination } from '@utils/pagination.js'
import type { LikeSongInput, AddHistoryInput, FollowArtistInput } from './library.schema.js'

export async function getLikedSongs(userId: string, page: number, limit: number) {
  const { offset } = parsePagination({ page, limit })
  const [songs, total] = await Promise.all([
    repo.getLikedSongs(userId, limit, offset),
    repo.getLikedSongsCount(userId),
  ])
  return { data: songs, total, page, limit, hasMore: offset + songs.length < total }
}

export async function likeSong(userId: string, input: LikeSongInput) {
  const existing = await repo.findLikedSong(userId, input.songId)
  if (existing) throw new ConflictError(`song ${input.songId} is already liked`)
  return repo.likeSong(userId, input)
}

export async function unlikeSong(userId: string, songId: string) {
  const existing = await repo.findLikedSong(userId, songId)
  if (!existing) throw new NotFoundError(`song ${songId} not in liked songs`)
  await repo.unlikeSong(userId, songId)
}

export async function isLiked(userId: string, songId: string) {
  const found = await repo.findLikedSong(userId, songId)
  return { liked: found !== null }
}

export async function getPlayHistory(userId: string, page: number, limit: number) {
  const { offset } = parsePagination({ page, limit })
  const history = await repo.getPlayHistory(userId, limit, offset)
  return { data: history, page, limit }
}

export async function addPlayHistory(userId: string, input: AddHistoryInput) {
  // fire-and-forget style — we don't block playback on this
  await repo.addPlayHistory(userId, input)
}

export async function clearPlayHistory(userId: string) {
  await repo.clearPlayHistory(userId)
}

export async function getFollowedArtists(userId: string, page: number, limit: number) {
  const { offset } = parsePagination({ page, limit })
  const artists = await repo.getFollowedArtists(userId, limit, offset)
  return { data: artists, page, limit }
}

export async function followArtist(userId: string, input: FollowArtistInput) {
  const existing = await repo.findFollowedArtist(userId, input.artistId)
  if (existing) throw new ConflictError(`already following artist ${input.artistId}`)
  return repo.followArtist(userId, input)
}

export async function unfollowArtist(userId: string, artistId: string) {
  const existing = await repo.findFollowedArtist(userId, artistId)
  if (!existing) throw new NotFoundError(`not following artist ${artistId}`)
  await repo.unfollowArtist(userId, artistId)
}

export async function isFollowing(userId: string, artistId: string) {
  const found = await repo.findFollowedArtist(userId, artistId)
  return { following: found !== null }
}
