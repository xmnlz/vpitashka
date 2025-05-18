import { relations, sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { guild } from "./guild";
import { eventmode } from "./eventmode";
import { shop } from "./shop";

export const shopItem = pgTable("shop_item", {
  id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  shopId: text("shop_id")
    .notNull()
    .references(() => shop.id),
  guildId: text("guild_id")
    .notNull()
    .references(() => guild.id, { onDelete: "cascade" }),
  createdBy: text("created_by")
    .notNull()
    .references(() => eventmode.id, {
      onDelete: "cascade",
    }),
});

export const shopItemRelation = relations(shopItem, ({ one }) => ({
  guild: one(guild, { fields: [shopItem.guildId], references: [guild.id] }),
  shop: one(shop, { fields: [shopItem.shopId], references: [shop.id] }),
  createdBy: one(eventmode, {
    fields: [shopItem.createdBy],
    references: [eventmode.id],
  }),
}));
