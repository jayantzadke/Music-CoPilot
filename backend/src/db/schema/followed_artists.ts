import { pgTable, uuid, varchar, text, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users.js'

export const followedArtists = pgTable(
  'followed_artists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    artistId: varchar('artist_id', { length: 50 }).notNull(),
    artistName: varchar('artist_name', { length: 200 }).notNull(),
    artistImage: text('artist_image'),
    followedAt: timestamp('followed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userArtistUnique: uniqueIndex('followed_artists_user_artist_unique').on(
      t.userId,
      t.artistId,
    ),
    userIdIdx: index('followed_artists_user_id_idx').on(t.userId),
  }),
)

export const followedArtistsRelations = relations(followedArtists, ({ one }) => ({
  user: one(users, {
    fields: [followedArtists.userId],
    references: [users.id],
  }),
}))

export type FollowedArtist = typeof followedArtists.$inferSelect
export type NewFollowedArtist = typeof followedArtists.$inferInsert
