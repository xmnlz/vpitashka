import { relations, sql } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { guild } from "./guild";
import { shopItem } from "./shop-item";

export const shop = pgTable("shop", {
  id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
  guildId: text("guild_id")
    .notNull()
    .references(() => guild.id, { onDelete: "cascade" }),
});

export const shopRelation = relations(shop, ({ one, many }) => ({
  guild: one(guild, { fields: [shop.id], references: [guild.id] }),
  items: many(shopItem),
}));
