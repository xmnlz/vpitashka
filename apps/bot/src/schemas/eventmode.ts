import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { guild } from "./guild";

export const permissionRole = {
  eventsmode: 1,
  coach: 2,
  curator: 3,
  moderator: 4,
  administrator: 5,
  developer: 6,
};

export const eventmode = pgTable(
  "eventmode",
  {
    id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
    isHired: boolean("is_hired").default(true).notNull(),
    userId: text("user_id").notNull(),
    guildId: text("guild_id")
      .references(() => guild.id, { onDelete: "cascade" })
      .notNull(),

    permissionRole: integer("permission_role")
      .default(permissionRole.eventsmode)
      .notNull(),

    // preferredLanguage: text("preferred_language")
    //   .default("en-US")
    //   .notNull()
    //   .$type<SupportedLanguages>(),

    totalTime: integer("total_time").default(0).notNull(),
    weeklyTime: integer("weekly_time").default(0).notNull(),
    totalSalary: integer("total_salary").default(0).notNull(),
    weeklySalary: integer("weekly_salary").default(0).notNull(),
    hearts: integer("hearts").default(0).notNull(),
    reputationScore: integer("reputation_score").default(100).notNull(),
    favoriteEvent: text("favorite_event").default("none").notNull(),
    hiredAt: timestamp("hired_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique().on(t.userId, t.guildId),
    check(
      "eventmode_permission_check",
      sql`${t.permissionRole} BETWEEN 1 and 6`,
    ),
  ],
);

export type SelectEventmode = typeof eventmode.$inferSelect;

export const eventmodeRelation = relations(eventmode, ({ one }) => ({
  guild: one(guild, { fields: [eventmode.guildId], references: [guild.id] }),
}));
