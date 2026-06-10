import { pgTable, uuid, varchar, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

// cron purges rows beyond 500 per user weekly
export const playHistory = pgTable(
  'play_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    songId: varchar('song_id', { length: 50 }).notNull(),
    songName: varchar('song_name', { length: 300 }).notNull(),
    songImage: text('song_image'),
    songArtists: varchar('song_artists', { length: 500 }).notNull(),
    albumId: varchar('album_id', { length: 50 }),
    playedAt: timestamp('played_at', { withTimezone: true }).notNull().defaultNow(),
    // how long they actually listened, in seconds
    playDuration: integer('play_duration'),
    completed: boolean('completed').notNull().default(false),
  },
  (t) => ({
    userPlayedAtIdx: index('play_history_user_played_at_idx').on(t.userId, t.playedAt),
    songIdIdx: index('play_history_song_id_idx').on(t.songId),
  }),
)

export const playHistoryRelations = relations(playHistory, ({ one }) => ({
  user: one(users, {
    fields: [playHistory.userId],
    references: [users.id],
  }),
}))

export type PlayHistory = typeof playHistory.$inferSelect
export type NewPlayHistory = typeof playHistory.$inferInsert
