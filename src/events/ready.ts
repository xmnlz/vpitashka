import { type ArgsOf, Client, Discord, On, Once } from 'discordx';
import { db } from '../database/data-source';
import { guilds } from '../schemas/guilds';
import { guildLogger } from '../schemas/guild-logger';

@Discord()
export class Event {
  @On({ event: 'ready' })
  async onReady(_: ArgsOf<'ready'>, bot: Client) {
    for await (const [_, { id }] of bot.guilds.cache) {
      await db.insert(guilds).values({ id }).onConflictDoNothing();

      await db.insert(guildLogger).values({ id }).onConflictDoNothing();
    }
  }

  @Once({ event: 'ready' })
  async onceReady(_: ArgsOf<'ready'>, bot: Client) {
    // Make sure all guilds are cached
    await bot.guilds.fetch();

    await bot.initApplicationCommands();

    console.info('[BOT]: Bot was successfully started!');
  }
}
