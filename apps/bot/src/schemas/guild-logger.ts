import { relations } from "drizzle-orm";
import { boolean, pgTable, text } from "drizzle-orm/pg-core";
import { guild } from "./guild";

export const guildLogger = pgTable("guild_logger", {
  id: text("id")
    .notNull()
    .primaryKey()
    .references(() => guild.id),

  isConfigured: boolean("is_configured").default(false).notNull(),
  guildToLog: text("guild_to_log"),
  channelToLog: text("channel_to_log"),
});

export const guildLoggerRelation = relations(guildLogger, ({ one }) => ({
  guild: one(guild, { fields: [guildLogger.id], references: [guild.id] }),
}));
