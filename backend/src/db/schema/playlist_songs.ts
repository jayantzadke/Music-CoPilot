import { pgTable, uuid, varchar, text, integer, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { playlists } from './playlists'
import { users } from './users'

export const playlistSongs = pgTable(
  'playlist_songs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playlistId: uuid('playlist_id')
      .notNull()
      .references(() => playlists.id, { onDelete: 'cascade' }),
    songId: varchar('song_id', { length: 50 }).notNull(),
    songName: varchar('song_name', { length: 300 }).notNull(),
    songImage: text('song_image'),
    songArtists: varchar('song_artists', { length: 500 }).notNull(),
    // duration in seconds
    songDuration: integer('song_duration').notNull().default(0),
    // 1-indexed to match what the frontend shows
    position: integer('position').notNull(),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
    addedBy: uuid('added_by')
      .notNull()
      .references(() => users.id),
  },
  (t) => ({
    playlistSongUnique: uniqueIndex('playlist_songs_playlist_song_unique').on(
      t.playlistId,
      t.songId,
    ),
    playlistIdIdx: index('playlist_songs_playlist_id_idx').on(t.playlistId),
    positionIdx: index('playlist_songs_position_idx').on(t.position),
  }),
)

export const playlistSongsRelations = relations(playlistSongs, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistSongs.playlistId],
    references: [playlists.id],
  }),
  addedByUser: one(users, {
    fields: [playlistSongs.addedBy],
    references: [users.id],
  }),
}))

export type PlaylistSong = typeof playlistSongs.$inferSelect
export type NewPlaylistSong = typeof playlistSongs.$inferInsert
