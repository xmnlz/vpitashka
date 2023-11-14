import { Client, MessageCreateOptions, Snowflake } from 'discord.js';
import { injectable } from 'tsyringe';
import type { Repository } from 'typeorm';
import { Database } from '../../database/data-source.js';
import { GuildLogger } from './guild-logger.entity.js';

@injectable()
export class LoggerService {
  private guildLoggerRepository: Repository<GuildLogger>;

  constructor(private readonly database: Database) {
    this.guildLoggerRepository = database.em.getRepository(GuildLogger);
  }

  async createLogger(guildId: string, loggerGuildId: string, loggerChannelId: string) {
    await this.guildLoggerRepository
      .create({ mainGuild: guildId, loggerGuild: loggerGuildId, loggerChannelId })
      .save();
  }

  async log(props: { guildId: Snowflake; bot: Client; message: MessageCreateOptions }) {
    const { guildId, bot, message } = props;

    const logger = await this.guildLoggerRepository.findOneBy({ mainGuild: guildId });

    if (logger) {
      const guild = await bot.guilds.fetch(logger.loggerGuild);
      const channel = await guild.channels.fetch(logger.loggerChannelId);

      if (channel && channel.isTextBased()) {
        await channel.send(message);
      }
    }
  }
}
