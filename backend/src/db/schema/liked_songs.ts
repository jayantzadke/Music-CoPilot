import { pgTable, uuid, varchar, text, integer, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

export const likedSongs = pgTable(
  'liked_songs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    songId: varchar('song_id', { length: 50 }).notNull(),
    songName: varchar('song_name', { length: 300 }).notNull(),
    songImage: text('song_image'),
    songArtists: varchar('song_artists', { length: 500 }).notNull(),
    songDuration: integer('song_duration').notNull().default(0),
    albumId: varchar('album_id', { length: 50 }),
    likedAt: timestamp('liked_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userSongUnique: uniqueIndex('liked_songs_user_song_unique').on(t.userId, t.songId),
    userLikedAtIdx: index('liked_songs_user_liked_at_idx').on(t.userId, t.likedAt),
  }),
)

export const likedSongsRelations = relations(likedSongs, ({ one }) => ({
  user: one(users, {
    fields: [likedSongs.userId],
    references: [users.id],
  }),
}))

export type LikedSong = typeof likedSongs.$inferSelect
export type NewLikedSong = typeof likedSongs.$inferInsert
