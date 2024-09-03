import { relations, sql } from 'drizzle-orm';
import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { eventsmodes } from './eventsmodes';
import { guilds } from './guilds';

export const warns = pgTable('warns', {
  id: uuid('id')
    .default(sql`uuid_generate_v4()`)
    .primaryKey()
    .notNull(),
  isVerbal: boolean('is_verbal').notNull(),
  reason: text('reason').notNull(),
  warnedAt: timestamp('warned_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  guildId: text('guild_id').references(() => guilds.id, { onDelete: 'cascade' }),
  executorId: uuid('executor_id')
    .notNull()
    .references(() => eventsmodes.id),
  targetId: uuid('target_id')
    .notNull()
    .references(() => eventsmodes.id),
});

export const warnRelation = relations(warns, ({ one }) => ({
  guild: one(guilds, { fields: [warns.guildId], references: [guilds.id] }),
  executor: one(eventsmodes, {
    fields: [warns.executorId],
    references: [eventsmodes.id],
    relationName: 'executor',
  }),
  target: one(eventsmodes, {
    fields: [warns.targetId],
    references: [eventsmodes.id],
    relationName: 'target',
  }),
}));
