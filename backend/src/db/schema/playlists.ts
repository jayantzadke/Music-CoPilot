import { pgTable, uuid, varchar, text, boolean, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users.js'
import { playlistSongs } from './playlist_songs.js'

export const playlists = pgTable(
  'playlists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    coverUrl: text('cover_url'),
    isPublic: boolean('is_public').notNull().default(false),
    // kept in sync by the service on every add/remove
    songCount: integer('song_count').notNull().default(0),
    totalDuration: integer('total_duration').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdIdx: index('playlists_user_id_idx').on(t.userId),
    publicIdx: index('playlists_is_public_idx').on(t.isPublic),
  }),
)

export const playlistsRelations = relations(playlists, ({ one, many }) => ({
  user: one(users, {
    fields: [playlists.userId],
    references: [users.id],
  }),
  songs: many(playlistSongs),
}))

export type Playlist = typeof playlists.$inferSelect
export type NewPlaylist = typeof playlists.$inferInsert
