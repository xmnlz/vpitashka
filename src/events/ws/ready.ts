import { ArgsOf, Client, Discord, Once } from 'discordx';
import { injectable } from 'tsyringe';
import { logger } from '../../lib/logger.js';

@Discord()
@injectable()
export class Event {
  @Once({ event: 'ready' })
  async onceReady(_: ArgsOf<'ready'>, bot: Client) {
    // Make sure all guilds are cached
    await bot.guilds.fetch();

    // Synchronize applications commands with Discord
    await bot.initApplicationCommands();

    logger.info('[BOT]: Bot was successfully started!');
  }
}
