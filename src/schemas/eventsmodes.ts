import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  pgEnum,
  pgTable,
  text,
  uuid,
  bigint,
  timestamp,
  index,
  integer,
  unique,
} from 'drizzle-orm/pg-core';
import { type SupportedLanguages } from '../lib/i18n';
import { guilds } from './guilds';
import { warns } from './warns';

export type PermissionRoleKeys = (typeof permissionRole)[keyof typeof permissionRole];
export const permissionRole = {
  eventsmode: 1,
  coach: 2,
  curator: 3,
  moderator: 4,
  administrator: 5,
  developer: 6,
};

type PermissionRole = PermissionRoleKeys;

export type SelectEventsmode = typeof eventsmodes.$inferSelect;

export const eventsmodes = pgTable(
  'eventsmodes',
  {
    id: uuid('id')
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),

    isHired: boolean('is_hired').default(true).notNull(),
    userId: text('user_id').notNull(),
    guildId: text('guild_id')
      .references(() => guilds.id, { onDelete: 'cascade' })
      .notNull(),

    // TODO: Add check constrain when drizzle implement it, number range between 0 and 5
    permissionRole: integer('permission_role')
      .default(permissionRole.eventsmode)
      .$type<PermissionRole>()
      .notNull(),

    preferredLanguage: text('preferred_language')
      .default('en-US')
      .notNull()
      .$type<SupportedLanguages>(),

    totalTime: bigint('total_time', { mode: 'number' }).default(0).notNull(),
    weeklyTime: bigint('weekly_time', { mode: 'number' }).default(0).notNull(),
    totalSalary: bigint('total_salary', { mode: 'number' }).default(0).notNull(),
    weeklySalary: bigint('weekly_salary', { mode: 'number' }).default(0).notNull(),
    hearts: bigint('hearts', { mode: 'number' }).default(0).notNull(),

    favoriteEvent: text('favorite_event').default('none').notNull(),
    longestEvent: bigint('longest_event', { mode: 'number' }).default(0).notNull(),
    hiredAt: timestamp('hired_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => {
    return {
      uniq: unique().on(table.userId, table.guildId),
      userIdx: index().on(table.userId),
      guildIdx: index().on(table.guildId),
    };
  },
);

export const eventsmodeRelations = relations(eventsmodes, ({ one, many }) => ({
  warns: many(warns, { relationName: 'executor' }),
  guild: one(guilds, { fields: [eventsmodes.guildId], references: [guilds.id] }),
}));
