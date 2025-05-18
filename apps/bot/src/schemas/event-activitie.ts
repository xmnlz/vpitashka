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

export const statusEnum = pgEnum("event_state", [
  "inactive",
  "started",
  "paused",
]);

export const eventActivitie = pgTable("event_activitie", {
  id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
  textChannelId: text("text_channel_id").notNull().unique(),
  voiceChannelId: text("voice_channel_id").notNull().unique(),
  status: statusEnum("status").default("inactive"),
  eventTime: integer("event_time").default(0).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  guildId: text("guild_id")
    .references(() => guild.id, { onDelete: "cascade" })
    .notNull(),
  eventId: uuid("event_id")
    .references(() => event.id, { onDelete: "cascade" })
    .notNull(),
  eventmodeId: uuid("eventsmode_id")
    .notNull()
    .references(() => eventmode.id, { onDelete: "cascade" })
    .unique(),
});

export const eventActivitieRelation = relations(eventActivitie, ({ one }) => ({
  guild: one(guild, {
    fields: [eventActivitie.guildId],
    references: [guild.id],
  }),
  event: one(event, {
    fields: [eventActivitie.eventId],
    references: [event.id],
  }),
  eventmode: one(eventmode, {
    fields: [eventActivitie.eventmodeId],
    references: [eventmode.id],
  }),
}));
