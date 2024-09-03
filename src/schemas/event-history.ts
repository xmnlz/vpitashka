import { relations, sql } from 'drizzle-orm';
import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { pgEnum } from 'drizzle-orm/pg-core';
import { eventsmodes } from './eventsmodes';
import { guilds } from './guilds';
import { events } from './events';


















export const eventHistoryTypeEnum = pgEnum('event_history_type_enum', ['weekly', 'global']);

export const eventHistory = pgTable('event_history', {
  id: uuid('id')
    .default(sql`uuid_generate_v4()`)
    .primaryKey()
    .notNull(),
  type: eventHistoryTypeEnum('type').default('global').notNull(),
  totalTime: integer('total_time').notNull(),
  totalSalary: integer('total_salary').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true, mode: 'date' }).notNull(),
  eventsmodeId: uuid('eventsmode_id')
    .references(() => eventsmodes.id, { onDelete: 'cascade' })
    .notNull(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  guildId: text('guild_id')
    .references(() => guilds.id, { onDelete: 'cascade' })
    .notNull(),
});

export const eventHistoryRelations = relations(eventHistory, ({ one }) => ({
  guild: one(guilds, { fields: [eventHistory.guildId], references: [guilds.id] }),
  eventsmode: one(eventsmodes, {
    fields: [eventHistory.eventsmodeId],
    references: [eventsmodes.id],
  }),
  event: one(events, { fields: [eventHistory.eventId], references: [events.id] }),
}));
