import { CommandInteraction } from 'discord.js';
import { GuardFunction } from 'discordx';
import { env } from 'process';
import { container } from 'tsyringe';
import { In, MoreThanOrEqual } from 'typeorm';
import { Database } from '../database/data-source.js';
import { Eventsmode, StaffRole } from '../feature/eventsmode/eventsmode.entity.js';
import { BotMessages, Colors } from '../lib/constants.js';
import { embedResponse } from '../lib/embed-response.js';
import { CommandError } from '../lib/errors/command.error.js';

const entityManager = container.resolve(Database).em;
export const AdministratorGuard: GuardFunction<CommandInteraction<'cached'>> = async (
  ctx,
  _bot,
  next,
) => {
  if (env.OWNER_ID && env.OWNER_ID === ctx.user.id) return next();

  const eventsmodeRepository = entityManager.getRepository(Eventsmode);

  const eventsmode = await eventsmodeRepository.findOneBy({
    isHired: true,
    userId: ctx.user.id,
    guild: { id: ctx.guild.id },
    staffRole: MoreThanOrEqual(StaffRole.Admin),
  });

  if (eventsmode) return next();

  throw new CommandError({
    ctx,
    content: embedResponse({
      template: BotMessages.PERMISSION_DENIED,
      status: Colors.DANGER,
      ephemeral: true,
    }),
  });
};
