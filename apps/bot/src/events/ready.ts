import { createEvent, initApplicationCommands } from "disenchantment";
import { db } from "../database/database";
import { guild } from "../schemas/guild";
import { guildLogger } from "../schemas/guild-logger";
import { config } from "../lib/safe-env";
import { clearOldWarnsCron } from "../lib/cron/clear-warns";

export const onceReadyEvent = createEvent({
  once: true,
  event: "ready",
  handler: async (client) => {
    await client.guilds.fetch();

    await initApplicationCommands(client, [config.DEV_GUILD_ID]);

    // start clearing warns after every rerun
    clearOldWarnsCron.trigger();

    console.log(`bot started successfully! ${client.user?.username}`);
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
