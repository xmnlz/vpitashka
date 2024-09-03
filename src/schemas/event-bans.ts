import { relations, sql } from 'drizzle-orm';
import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { eventsmodes } from './eventsmodes';
import { guilds } from './guilds';
import { users } from './users';

export const eventBans = pgTable('event_bans', {
  id: uuid('id')
    .default(sql`uuid_generate_v4()`)
    .primaryKey()
    .notNull(),
  isGlobal: boolean('is_global').default(false).notNull(),
  days: integer('days').notNull(),
  reason: text('reason').notNull(),
  bannedAt: timestamp('banned_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  executorId: uuid('executor_id')
    .notNull()
    .references(() => eventsmodes.id, { onDelete: 'cascade' }),
  targetId: uuid('target_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  guildId: text('guild_id').references(() => guilds.id, { onDelete: 'cascade' }),
});

export const eventBanRelations = relations(eventBans, ({ one }) => ({
  guild: one(guilds, { fields: [eventBans.guildId], references: [guilds.id] }),
  executor: one(eventsmodes, { fields: [eventBans.executorId], references: [eventsmodes.id] }),
  target: one(users, { fields: [eventBans.targetId], references: [users.id] }),
}));


