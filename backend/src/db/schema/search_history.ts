import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

// max 20 rows per user, service layer enforces this
export const searchHistory = pgTable(
  'search_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    query: varchar('query', { length: 255 }).notNull(),
    resultType: varchar('result_type', { length: 20 }),
    resultId: varchar('result_id', { length: 50 }),
    searchedAt: timestamp('searched_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userSearchedAtIdx: index('search_history_user_searched_at_idx').on(
      t.userId,
      t.searchedAt,
    ),
  }),
)

export const searchHistoryRelations = relations(searchHistory, ({ one }) => ({
  user: one(users, {
    fields: [searchHistory.userId],
    references: [users.id],
  }),
}))

export type SearchHistory = typeof searchHistory.$inferSelect
export type NewSearchHistory = typeof searchHistory.$inferInsert
