import { relations, sql } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  uuid,
  unique,
  integer,
} from "drizzle-orm/pg-core";
import { guild } from "./guild";

// NOTE: This table is not in use; it was added for the sake of new features
export const user = pgTable(
  "user",
  {
    id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
    userId: text("user_id").notNull(),
    guildId: text("guild_id").references(() => guild.id),

    reputationScore: integer("reputation_score").default(100).notNull(),
    totalEventTime: integer("total_event_time").default(0).notNull(),
    favoriteEvent: text("favorite_event").default("none").notNull(),
  },
  (table) => [
    unique().on(table.userId, table.guildId),
    index().on(table.userId, table.guildId),
  ],
);

export const userRelations = relations(user, ({ one }) => ({
  guild: one(guild, { fields: [user.guildId], references: [guild.id] }),
}));
