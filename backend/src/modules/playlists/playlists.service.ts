import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@errors/index.js'
import * as repo from './playlists.repository.js'
import { parsePagination } from '@utils/pagination.js'
import type { CreatePlaylistInput, UpdatePlaylistInput, AddSongInput, ReorderSongInput } from './playlists.schema.js'

const MAX_PLAYLIST_SIZE = 500

export async function getUserPlaylists(userId: string, page: number, limit: number) {
  const { offset } = parsePagination({ page, limit })
  const [items, total] = await Promise.all([
    repo.findPlaylistsByUser(userId, limit, offset),
    repo.countPlaylistsByUser(userId),
  ])
  return { data: items, total, page, limit, hasMore: offset + items.length < total }
}

export async function createPlaylist(userId: string, input: CreatePlaylistInput) {
  return repo.createPlaylist({
    userId,
    name: input.name,
    description: input.description ?? null,
    isPublic: input.isPublic ?? false,
  })
}

export async function getPlaylist(id: string, requestingUserId?: string) {
  const playlist = await repo.findPlaylistById(id)
  if (!playlist) throw new NotFoundError(`playlist ${id} not found`)

  if (!playlist.isPublic && playlist.userId !== requestingUserId) {
    throw new ForbiddenError('this playlist is private')
  }

  const songs = await repo.getPlaylistSongs(id)
  return { ...playlist, songs }
}

export async function updatePlaylist(id: string, userId: string, input: UpdatePlaylistInput) {
  const playlist = await repo.findPlaylistById(id)
  if (!playlist) throw new NotFoundError(`playlist ${id} not found`)
  if (playlist.userId !== userId) throw new ForbiddenError('not your playlist')

  const data = Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined),
  )

  return repo.updatePlaylist(id, data)
}

export async function deletePlaylist(id: string, userId: string) {
  const playlist = await repo.findPlaylistById(id)
  if (!playlist) throw new NotFoundError(`playlist ${id} not found`)
  if (playlist.userId !== userId) throw new ForbiddenError('not your playlist')
  await repo.deletePlaylist(id)
}

export async function addSong(playlistId: string, userId: string, input: AddSongInput) {
  const playlist = await repo.findPlaylistById(playlistId)
  if (!playlist) throw new NotFoundError(`playlist ${playlistId} not found`)
  if (playlist.userId !== userId) throw new ForbiddenError('not your playlist')

  const existing = await repo.findSongInPlaylist(playlistId, input.songId)
  if (existing) throw new ConflictError(`song already in playlist`)

  if (playlist.songCount >= MAX_PLAYLIST_SIZE) {
    throw new ValidationError(`playlist can't exceed ${MAX_PLAYLIST_SIZE} songs`)
  }

  const position = playlist.songCount + 1
  const song = await repo.addSongToPlaylist(playlistId, userId, input, position)

  // keep song_count in sync
  await repo.updatePlaylist(playlistId, {
    songCount: playlist.songCount + 1,
    totalDuration: playlist.totalDuration + (input.songDuration ?? 0),
  })

  return song
}

export async function removeSong(playlistId: string, userId: string, songId: string) {
  const playlist = await repo.findPlaylistById(playlistId)
  if (!playlist) throw new NotFoundError(`playlist ${playlistId} not found`)
  if (playlist.userId !== userId) throw new ForbiddenError('not your playlist')

  const song = await repo.findSongInPlaylist(playlistId, songId)
  if (!song) throw new NotFoundError(`song ${songId} not in playlist`)

  await repo.removeSongFromPlaylist(playlistId, songId)
  await repo.updatePlaylist(playlistId, {
    songCount: Math.max(0, playlist.songCount - 1),
    totalDuration: Math.max(0, playlist.totalDuration - song.songDuration),
  })
}

export async function reorderSong(playlistId: string, userId: string, input: ReorderSongInput) {
  const playlist = await repo.findPlaylistById(playlistId)
  if (!playlist) throw new NotFoundError(`playlist ${playlistId} not found`)
  if (playlist.userId !== userId) throw new ForbiddenError('not your playlist')

  const song = await repo.findSongInPlaylist(playlistId, input.songId)
  if (!song) throw new NotFoundError(`song ${input.songId} not in playlist`)

  // simple swap — move song to new position, shift others
  const songs = await repo.getPlaylistSongs(playlistId)
  const oldPos = song.position
  const newPos = Math.min(Math.max(1, input.newPosition), songs.length)

  if (oldPos === newPos) return

  // batch update positions in a transaction
  await db_reorderTransaction(playlistId, input.songId, oldPos, newPos, songs)
}

// extracted to keep service method under 40 lines
async function db_reorderTransaction(
  playlistId: string,
  songId: string,
  oldPos: number,
  newPos: number,
  songs: Awaited<ReturnType<typeof repo.getPlaylistSongs>>,
) {
  const { db } = await import('@config/db.js')
  const { playlistSongs } = await import('@db/schema/index.js')
  const { eq, and } = await import('drizzle-orm')

  await db.transaction(async (tx) => {
    for (const s of songs) {
      let pos = s.position
      if (s.songId === songId) {
        pos = newPos
      } else if (oldPos < newPos && s.position > oldPos && s.position <= newPos) {
        pos = s.position - 1
      } else if (oldPos > newPos && s.position >= newPos && s.position < oldPos) {
        pos = s.position + 1
      }
      if (pos !== s.position) {
        await tx
          .update(playlistSongs)
          .set({ position: pos })
          .where(and(eq(playlistSongs.playlistId, playlistId), eq(playlistSongs.songId, s.songId)))
      }
    }
  })
}
