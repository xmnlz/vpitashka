import { relations } from 'drizzle-orm';
import { boolean, pgTable, text } from 'drizzle-orm/pg-core';
import { guilds } from './guilds';

export const guildLogger = pgTable('guild_logger', {
  id: text('id')
    .notNull()
    .primaryKey()
    .references(() => guilds.id),

  isConfigured: boolean('is_configured').default(false).notNull(),
  guildToLog: text('guild_to_log'),
  channelToLog: text('channel_to_log'),
});

export const guildLoggerRelations = relations(guildLogger, ({ one }) => ({
  guild: one(guilds, { fields: [guildLogger.id], references: [guilds.id] }),
}));
