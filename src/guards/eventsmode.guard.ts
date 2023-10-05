import { CommandInteraction } from 'discord.js';
import { GuardFunction } from 'discordx';
import { container } from 'tsyringe';
import { In } from 'typeorm';
import { Database } from '../database/data-source.js';
import { Eventsmode, PositionRole } from '../database/entity/eventsmode.entity.js';

const entityManager = container.resolve(Database).em;
export const EventsmodeGuard: GuardFunction<CommandInteraction<'cached'>> = async (
  ctx,
  _bot,
  next
) => {
  const eventsmodeRepository = entityManager.getRepository(Eventsmode);

  const eventsmode = await eventsmodeRepository.findOneBy({
    isHired: true,
    userId: ctx.user.id,
    guild: { id: ctx.guild.id },
    position: In([
      PositionRole.Eventsmode,
      PositionRole.Coach,
      PositionRole.Curator,
      PositionRole.Moderator,
      PositionRole.Admin,
    ]),
  });

  if (eventsmode) return next();

  await ctx.reply({ content: 'You are not eventsmode, :(', ephemeral: true });
  return;
};
