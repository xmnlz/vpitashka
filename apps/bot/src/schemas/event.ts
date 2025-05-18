import { relations, sql } from "drizzle-orm";
import {
  doublePrecision,
  index,
  json,
  pgTable,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { guild } from "./guild";

export const event = pgTable(
  "event",
  {
    id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    multiplayer: doublePrecision("multiplayer").notNull(),
    startEmbed: json("start_embed").notNull(),
    candyPerMinute: doublePrecision("candy_per_minute").notNull(),
    guildId: text("guild_id").references(() => guild.id, {
      onDelete: "cascade",
    }),
  },
  (t) => [unique().on(t.name, t.category), index().on(t.name, t.category)],
);

export const eventRelation = relations(event, ({ one }) => ({
  guild: one(guild, { fields: [event.guildId], references: [guild.id] }),
}));
