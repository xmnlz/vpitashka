import { relations, sql } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { event } from "./event";
import { eventmode } from "./eventmode";
import { guild } from "./guild";

export const eventHistoryTypeEnum = pgEnum("event_history_type_enum", [
  "weekly",
  "global",
]);

export const eventHistory = pgTable("event_history", {
  id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
  type: eventHistoryTypeEnum("type").default("global").notNull(),
  totalTime: integer("total_time").notNull(),
  totalSalary: integer("total_salary").notNull(),
  startedAt: timestamp("started_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  endedAt: timestamp("ended_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  eventmodeId: uuid("eventmode_id")
    .references(() => eventmode.id, { onDelete: "cascade" })
    .notNull(),
  eventId: uuid("event_id")
    .references(() => event.id, { onDelete: "cascade" })
    .notNull(),
  guildId: text("guild_id")
    .references(() => guild.id, { onDelete: "cascade" })
    .notNull(),
});

export const eventHistoryRelation = relations(eventHistory, ({ one }) => ({
  guild: one(guild, { fields: [eventHistory.guildId], references: [guild.id] }),
  eventsmode: one(eventmode, {
    fields: [eventHistory.eventmodeId],
    references: [eventmode.id],
  }),
  event: one(event, {
    fields: [eventHistory.eventId],
    references: [event.id],
  }),
}));
