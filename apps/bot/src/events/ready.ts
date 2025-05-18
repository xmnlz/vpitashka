import { createEvent } from "disenchantment";
import { db } from "../database/database";
import { guild } from "../schemas/guild";
import { guildLogger } from "../schemas/guild-logger";

export const onceReadyEvent = createEvent({
  once: true,
  event: "ready",
  handler: async (client) => {
    await client.guilds.fetch();
    console.log("BOT STARTED");
  },
});

export const readyEvent = createEvent({
  event: "ready",
  handler: async (client) => {
    for await (const [_, { id }] of client.guilds.cache) {
      await db.insert(guild).values({ id }).onConflictDoNothing();
      await db.insert(guildLogger).values({ id }).onConflictDoNothing();
    }
  },
});
