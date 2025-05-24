import { relations, sql } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { eventmode } from "./eventmode";
import { guild } from "./guild";

export const warn = pgTable("warns", {
  id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
  isVerbal: boolean("is_verbal").notNull(),
  reason: text("reason").notNull(),
  warnedAt: timestamp("warned_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  guildId: text("guild_id")
    .notNull()
    .references(() => guild.id, {
      onDelete: "cascade",
    }),
  executorId: uuid("executor_id")
    .notNull()
    .references(() => eventmode.id),
  targetId: uuid("target_id")
    .notNull()
    .references(() => eventmode.id),
});

export const warnRelation = relations(warn, ({ one }) => ({
  guild: one(guild, { fields: [warn.guildId], references: [guild.id] }),
  executor: one(eventmode, {
    fields: [warn.executorId],
    references: [eventmode.id],
    relationName: "executor",
  }),
  target: one(eventmode, {
    fields: [warn.targetId],
    references: [eventmode.id],
    relationName: "target",
  }),
}));
