import { eq, and, desc, count, asc } from 'drizzle-orm'
import { db } from '@config/db.js'
import { playlists, playlistSongs } from '@db/schema/index.js'
import type { Playlist } from '@db/schema/playlists.js'
import type { PlaylistSong } from '@db/schema/playlist_songs.js'
import type { AddSongInput } from './playlists.schema.js'

export async function findPlaylistById(id: string): Promise<Playlist | null> {
  const result = await db.select().from(playlists).where(eq(playlists.id, id))
  return (result[0] as Playlist | undefined) ?? null
}

export async function findPlaylistsByUser(userId: string, limit: number, offset: number) {
  return db
    .select()
    .from(playlists)
    .where(eq(playlists.userId, userId))
    .orderBy(desc(playlists.updatedAt))
    .limit(limit)
    .offset(offset)
}

export async function countPlaylistsByUser(userId: string) {
  const result = await db
    .select({ count: count() })
    .from(playlists)
    .where(eq(playlists.userId, userId))
  return result[0]?.count ?? 0
}

export async function createPlaylist(data: typeof playlists.$inferInsert): Promise<Playlist> {
  const result = await db.insert(playlists).values(data).returning()
  if (!result[0]) throw new Error('playlist insert returned nothing')
  return result[0] as Playlist
}

export async function updatePlaylist(id: string, data: Partial<Playlist>): Promise<Playlist> {
  const result = await db
    .update(playlists)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(playlists.id, id))
    .returning()
  if (!result[0]) throw new Error(`playlist ${id} not found after update`)
  return result[0] as Playlist
}

export async function deletePlaylist(id: string) {
  await db.delete(playlists).where(eq(playlists.id, id))
}

export async function findSongInPlaylist(playlistId: string, songId: string): Promise<PlaylistSong | null> {
  const result = await db
    .select()
    .from(playlistSongs)
    .where(and(eq(playlistSongs.playlistId, playlistId), eq(playlistSongs.songId, songId)))
  return (result[0] as PlaylistSong | undefined) ?? null
}

export async function getPlaylistSongs(playlistId: string) {
  return db
    .select()
    .from(playlistSongs)
    .where(eq(playlistSongs.playlistId, playlistId))
    .orderBy(asc(playlistSongs.position))
}

export async function addSongToPlaylist(
  playlistId: string,
  userId: string,
  input: AddSongInput,
  position: number,
): Promise<PlaylistSong> {
  const result = await db
    .insert(playlistSongs)
    .values({
      playlistId,
      addedBy: userId,
      position,
      songId: input.songId,
      songName: input.songName,
      songArtists: input.songArtists,
      songDuration: input.songDuration,
      songImage: input.songImage ?? null,
    })
    .returning()
  if (!result[0]) throw new Error('song insert returned nothing')
  return result[0] as PlaylistSong
}

export async function removeSongFromPlaylist(playlistId: string, songId: string) {
  await db
    .delete(playlistSongs)
    .where(and(eq(playlistSongs.playlistId, playlistId), eq(playlistSongs.songId, songId)))
}

export async function getSongCount(playlistId: string) {
  const result = await db
    .select({ count: count() })
    .from(playlistSongs)
    .where(eq(playlistSongs.playlistId, playlistId))
  return result[0]?.count ?? 0
}
