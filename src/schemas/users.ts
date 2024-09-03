import { relations, sql } from 'drizzle-orm';
import { bigint, char, index, pgTable, text, uuid, unique } from 'drizzle-orm/pg-core';
import { guilds } from './guilds';

// NOTE: This table is not in use; it was added for the sake of new features
export const users = pgTable(
  'users',
  {
    id: uuid('id')
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    userId: text('user_id').notNull(),
    guildId: text('guild_id').references(() => guilds.id),

    // NOTE: Not in use right now
    reputationScore: bigint('reputation_score', { mode: 'number' }).default(100).notNull(),
    totalEventTime: bigint('total_event_time', { mode: 'number' }).default(0).notNull(),
    favoriteEvent: text('favorite_event').default('none').notNull(),
  },
  (table) => {
    return {
      uniq: unique().on(table.userId, table.guildId),
      userIdx: index().on(table.userId),
      guildIdx: index().on(table.guildId),
    };
  },
);

export const usersRelations = relations(users, ({ one }) => ({
  guild: one(guilds, { fields: [users.guildId], references: [guilds.id] }),
}));
