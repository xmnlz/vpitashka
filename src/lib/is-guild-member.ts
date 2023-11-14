import { Guild, Snowflake } from 'discord.js';

export const isGuildMember = async (guild: Guild, userId: Snowflake) => {
  await guild.members
    .fetch(userId)
    .then(() => true)
    .catch(() => false);

  return false;
};
