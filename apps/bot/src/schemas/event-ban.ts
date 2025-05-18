import { relations, sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { eventmode } from "./eventmode";
import { guild } from "./guild";
import { user } from "./user";

export const eventBan = pgTable("event_ban", {
  id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
  isGlobal: boolean("is_global").default(false).notNull(),
  days: integer("days").notNull(),
  reason: text("reason").notNull(),
  bannedAt: timestamp("banned_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  executorId: uuid("executor_id")
    .notNull()
    .references(() => eventmode.id, { onDelete: "cascade" }),
  targetId: uuid("target_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  guildId: text("guild_id").references(() => guild.id, {
    onDelete: "cascade",
  }),
});

export const eventBanRelation = relations(eventBan, ({ one }) => ({
  guild: one(guild, { fields: [eventBan.guildId], references: [guild.id] }),
  executor: one(eventmode, {
    fields: [eventBan.executorId],
    references: [eventmode.id],
  }),
  target: one(user, { fields: [eventBan.targetId], references: [user.id] }),
}));
