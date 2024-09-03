import type { MessageCreateOptions } from 'discord.js';
import type { Client } from 'discord.js';
import { eq } from 'drizzle-orm';
import { db } from '../../../database/data-source'
import { guildLogger } from '../../../schemas/guild-logger';

export const log = async (
  guildId: string,
  {
    bot,
    message,
  }: {
    bot: Client;
    message: MessageCreateOptions;
  },
) => {
  const logger = await db.query.guildLogger.findFirst({ where: eq(guildLogger.id, guildId) });

  if (!logger) return;

  if (!logger.guildToLog && logger.channelToLog) {
    const localGuild = await bot.guilds.fetch(guildId);
    const channel = await localGuild.channels.fetch(logger.channelToLog);

    if (channel && channel.isTextBased()) {
      await channel.send(message);
    }

    return;
  }

  if (logger.guildToLog && logger.channelToLog) {
    const guild = await bot.guilds.fetch(logger.guildToLog);
    const channel = await guild.channels.fetch(logger.channelToLog);

    if (channel && channel.isTextBased()) {
      await channel.send(message);
    }
  }
};
