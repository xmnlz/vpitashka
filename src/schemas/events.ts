import { relations, sql } from 'drizzle-orm';
import { doublePrecision, pgTable, text, uuid, unique, json } from 'drizzle-orm/pg-core';
import { guilds } from './guilds';

export const events = pgTable(
  'events',
  {
    id: uuid('id')
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    name: text('name').notNull(),
    category: text('category').notNull(),
    multiplayer: doublePrecision('multiplayer').notNull(),
    startEmbed: json('start_embed').notNull(),
    candyPerMinute: doublePrecision('candy_per_minute').notNull(),
    guildId: text('guild_id').references(() => guilds.id, { onDelete: 'cascade' }),
  },
  (table) => {
    return {
      uniq: unique().on(table.name, table.category),
    };
  },
);

export const eventRelations = relations(events, ({ one }) => ({
  guild: one(guilds, { fields: [events.guildId], references: [guilds.id] }),
}));
