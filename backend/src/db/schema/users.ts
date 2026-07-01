import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { refreshTokens } from './refresh_tokens.js'
import { playlists } from './playlists.js'
import { likedSongs } from './liked_songs.js'
import { followedArtists } from './followed_artists.js'
import { playHistory } from './play_history.js'
import { searchHistory } from './search_history.js'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  // null for oauth users
  passwordHash: varchar('password_hash', { length: 255 }),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  avatarUrl: text('avatar_url'),
  isVerified: boolean('is_verified').notNull().default(false),
  provider: varchar('provider', { length: 20 }).notNull().default('local'),
  providerId: varchar('provider_id', { length: 255 }),
  preferredLang: varchar('preferred_lang', { length: 20 }).notNull().default('hindi'),
  audioQuality: varchar('audio_quality', { length: 10 }).notNull().default('320kbps'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  playlists: many(playlists),
  likedSongs: many(likedSongs),
  followedArtists: many(followedArtists),
  playHistory: many(playHistory),
  searchHistory: many(searchHistory),
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
