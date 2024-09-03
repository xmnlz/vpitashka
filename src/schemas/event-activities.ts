import { relations, sql } from 'drizzle-orm';
import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { eventsmodes } from './eventsmodes';
import { guilds } from './guilds';
import { events } from './events';

export const eventActivities = pgTable('event_activities', {
  id: uuid('id')
    .default(sql`uuid_generate_v4()`)
    .primaryKey()
    .notNull(),

  textChannelId: text('text_channel_id').notNull().unique(),
  voiceChannelId: text('voice_channel_id').notNull().unique(),
  eventTime: integer('event_time').default(0).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  isStared: boolean('is_stared').default(false).notNull(),
  isPaused: boolean('is_paused').default(false).notNull(),
  isEnded: boolean('is_ended').default(false).notNull(),
  guildId: text('guild_id')
    .references(() => guilds.id, { onDelete: 'cascade' })
    .notNull(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  eventsmodeId: uuid('eventsmode_id')
    .notNull()
    .references(() => eventsmodes.id, { onDelete: 'cascade' })
    .unique(),
});

export const eventActivityRelations = relations(eventActivities, ({ one }) => ({
  guild: one(guilds, { fields: [eventActivities.guildId], references: [guilds.id] }),
  event: one(events, { fields: [eventActivities.eventId], references: [events.id] }),
  eventsmode: one(eventsmodes, {
    fields: [eventActivities.eventsmodeId],
    references: [eventsmodes.id],
  }),
}));
