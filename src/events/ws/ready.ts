import { ArgsOf, Client, Discord, On, Once } from 'discordx';
import { injectable } from 'tsyringe';
import { logger } from '../../lib/logger.js';
import { GuildService } from '../../feature/guild/guild.service.js';
import { eventSchedule } from '../../lib/schedules/event.schedule.js';
import { warnSchedule } from '../../lib/schedules/warn.schedule.js';

@Discord()
@injectable()
export class Event {
  constructor(private guildService: GuildService) {}
  @On({ event: 'ready' })
  async onReady(_: ArgsOf<'ready'>, bot: Client) {
    for await (const [_, { id }] of bot.guilds.cache) {
      await this.guildService.registerGuild(id);
    }

    eventSchedule.invoke();
    warnSchedule.invoke();

    logger.info('[BOT]: All guild are saved to db');
  }

  @Once({ event: 'ready' })
  async onceReady(_: ArgsOf<'ready'>, bot: Client) {
    // Make sure all guilds are cached
    await bot.guilds.fetch();

    // Synchronize applications commands with Discord
    await bot.initApplicationCommands();

    logger.info('[BOT]: Bot was successfully started!');
  }
}
