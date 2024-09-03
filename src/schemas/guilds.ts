import { relations } from 'drizzle-orm';
import { boolean, jsonb, pgTable, text } from 'drizzle-orm/pg-core';
import { type SupportedLanguages } from '../lib/i18n';
import { events } from './events';
import { eventActivities } from './event-activities';
import { eventBans } from './event-bans';
import { eventHistory } from './event-history';
import { eventsmodes } from './eventsmodes';
import { guildLogger } from './guild-logger';
import { users } from './users';
import { warns } from './warns';

export type SelectGuild = typeof guilds.$inferSelect;

type GuildProtoSettings = {
  general: {
    minimumWeeklyQuota: number;
  };

  roles: {
    eventsmodeRoleId: string | null;
    coachRoleId: string | null;
    curatorRoleId: string | null;
    moderatorRoleId: string | null;
    adminRoleId: string | null;
  };

  channels: {
    eventCategoryId: string | null;
    startedEventCategoryId: string | null;
    announceEventChannelId: string | null;
  };

  features: {
    eventAnnouncement: boolean;
    eventAutoPayment: boolean;
    eventActiveCategory: boolean;
  };
};

export const guilds = pgTable('guilds', {
  id: text('id').primaryKey().notNull(),
  isEnabled: boolean('is_enabled').default(false).notNull(),
  preferredLanguage: text('preferred_language')
    .default('en-US')
    .notNull()
    .$type<SupportedLanguages>(),
  protoSettings: jsonb('proto_settings')
    .notNull()
    .$type<GuildProtoSettings>()
    // 5 hours | 5 * 60
    .default({
      general: {
        minimumWeeklyQuota: 300,
      },
      roles: {
        adminRoleId: null,
        moderatorRoleId: null,
        curatorRoleId: null,
        coachRoleId: null,
        eventsmodeRoleId: null,
      },
      channels: {
        eventCategoryId: null,
        announceEventChannelId: null,
        startedEventCategoryId: null,
      },
      features: {
        eventAnnouncement: false,
        eventAutoPayment: false,
        eventActiveCategory: false,
      },
    }),
});

export const guildRelations = relations(guilds, ({ one, many }) => ({
  logger: one(guildLogger, { fields: [guilds.id], references: [guildLogger.id] }),
  eventActivity: many(eventActivities),
  eventHistory: many(eventHistory),
  eventsmodes: many(eventsmodes),
  eventBan: many(eventBans),
  events: many(events),
  warns: many(warns),
  users: many(users),
}));
