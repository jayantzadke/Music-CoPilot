import { eq, and, desc, sql, count } from 'drizzle-orm'
import { db } from '@config/db.js'
import { likedSongs, followedArtists, playHistory, searchHistory } from '@db/schema/index.js'
import type { LikeSongInput, AddHistoryInput, FollowArtistInput } from './library.schema.js'

const MAX_HISTORY_ROWS = 500
const MAX_SEARCH_HISTORY_ROWS = 20

export async function getLikedSongs(userId: string, limit: number, offset: number) {
  return db
    .select()
    .from(likedSongs)
    .where(eq(likedSongs.userId, userId))
    .orderBy(desc(likedSongs.likedAt))
    .limit(limit)
    .offset(offset)
}

export async function getLikedSongsCount(userId: string) {
  const result = await db
    .select({ count: count() })
    .from(likedSongs)
    .where(eq(likedSongs.userId, userId))
  return result[0]?.count ?? 0
}

export async function findLikedSong(userId: string, songId: string) {
  const result = await db
    .select()
    .from(likedSongs)
    .where(and(eq(likedSongs.userId, userId), eq(likedSongs.songId, songId)))
  return result[0] ?? null
}

export async function likeSong(userId: string, input: LikeSongInput) {
  const result = await db
    .insert(likedSongs)
    .values({
      userId,
      songId: input.songId,
      songName: input.songName,
      songArtists: input.songArtists,
      songDuration: input.songDuration,
      songImage: input.songImage ?? null,
      albumId: input.albumId ?? null,
    })
    .returning()
  return result[0]
}

export async function unlikeSong(userId: string, songId: string) {
  await db
    .delete(likedSongs)
    .where(and(eq(likedSongs.userId, userId), eq(likedSongs.songId, songId)))
}

export async function getPlayHistory(userId: string, limit: number, offset: number) {
  return db
    .select()
    .from(playHistory)
    .where(eq(playHistory.userId, userId))
    .orderBy(desc(playHistory.playedAt))
    .limit(limit)
    .offset(offset)
}

export async function addPlayHistory(userId: string, input: AddHistoryInput) {
  await db.insert(playHistory).values({
    userId,
    songId: input.songId,
    songName: input.songName,
    songArtists: input.songArtists,
    completed: input.completed,
    songImage: input.songImage ?? null,
    albumId: input.albumId ?? null,
    playDuration: input.playDuration ?? null,
  })

  // purge rows beyond 500 — we only keep recent history
  const countResult = await db
    .select({ count: count() })
    .from(playHistory)
    .where(eq(playHistory.userId, userId))
  const total = countResult[0]?.count ?? 0

  if (total > MAX_HISTORY_ROWS) {
    await db.execute(sql`
      DELETE FROM play_history
      WHERE user_id = ${userId}
      AND id NOT IN (
        SELECT id FROM play_history
        WHERE user_id = ${userId}
        ORDER BY played_at DESC
        LIMIT ${MAX_HISTORY_ROWS}
      )
    `)
  }
}

export async function clearPlayHistory(userId: string) {
  await db.delete(playHistory).where(eq(playHistory.userId, userId))
}

export async function getFollowedArtists(userId: string, limit: number, offset: number) {
  return db
    .select()
    .from(followedArtists)
    .where(eq(followedArtists.userId, userId))
    .orderBy(desc(followedArtists.followedAt))
    .limit(limit)
    .offset(offset)
}

export async function findFollowedArtist(userId: string, artistId: string) {
  const result = await db
    .select()
    .from(followedArtists)
    .where(and(eq(followedArtists.userId, userId), eq(followedArtists.artistId, artistId)))
  return result[0] ?? null
}

export async function followArtist(userId: string, input: FollowArtistInput) {
  const result = await db
    .insert(followedArtists)
    .values({
      userId,
      artistId: input.artistId,
      artistName: input.artistName,
      artistImage: input.artistImage ?? null,
    })
    .returning()
  return result[0]
}

export async function unfollowArtist(userId: string, artistId: string) {
  await db
    .delete(followedArtists)
    .where(and(eq(followedArtists.userId, userId), eq(followedArtists.artistId, artistId)))
}

export async function getSearchHistory(userId: string) {
  return db
    .select()
    .from(searchHistory)
    .where(eq(searchHistory.userId, userId))
    .orderBy(desc(searchHistory.searchedAt))
    .limit(MAX_SEARCH_HISTORY_ROWS)
}

export async function addSearchHistory(
  userId: string,
  query: string,
  resultType?: string,
  resultId?: string,
) {
  await db.insert(searchHistory).values({
    userId,
    query,
    resultType: resultType ?? null,
    resultId: resultId ?? null,
  })

  // trim to 20 most recent
  await db.execute(sql`
    DELETE FROM search_history
    WHERE user_id = ${userId}
    AND id NOT IN (
      SELECT id FROM search_history
      WHERE user_id = ${userId}
      ORDER BY searched_at DESC
      LIMIT ${MAX_SEARCH_HISTORY_ROWS}
    )
  `)
}
