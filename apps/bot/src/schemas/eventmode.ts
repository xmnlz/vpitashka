import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { guild } from "./guild";
import { warn } from "./warn";

// NOTE: I hate enums
export enum PermissionRole {
  eventsmode = 1,
  coach,
  curator,
  moderator,
  administrator,
  developer,
}

export const permissionToString = (permission: number) => {
  return PermissionRole[permission] ?? "unknown";
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
      .default(PermissionRole.eventsmode)
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
    index().on(t.userId, t.guildId),
    unique().on(t.userId, t.guildId),
    check(
      "eventmode_permission_check",
      sql`${t.permissionRole} BETWEEN 1 and 6`,
    ),
  ],
);

export type SelectEventmode = typeof eventmode.$inferSelect;

export const eventmodeRelation = relations(eventmode, ({ one, many }) => ({
  guild: one(guild, { fields: [eventmode.guildId], references: [guild.id] }),
  warnsIssued: many(warn, { relationName: "executor" }),
  warns: many(warn, { relationName: "target" }),
}));
