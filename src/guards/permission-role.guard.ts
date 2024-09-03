import type {
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  CommandInteraction,
  ContextMenuCommandInteraction,
  MentionableSelectMenuInteraction,
  ModalSubmitInteraction,
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
} from 'discord.js';
import type { GuardFunction } from 'discordx';
import { and, eq, gte } from 'drizzle-orm';
import { db } from '../database/data-source';

import { BotMessages, Colors } from '../lib/constants';
import { embedResponse } from '../lib/embed-response';
import { safeReply } from '../lib/safe-reply';

import {
  type PermissionRoleKeys,
  eventsmodes,
  type SelectEventsmode,
} from '../schemas/eventsmodes';
import type { SelectGuild } from '../schemas/guilds';

export type GuardPropsType = { eventsmode: SelectEventsmode; guild: SelectGuild };

export const PermissionRole = (role: PermissionRoleKeys) => {
  const guard: GuardFunction<
    | CommandInteraction<'cached'>
    | ButtonInteraction<'cached'>
    | ChannelSelectMenuInteraction<'cached'>
    | ContextMenuCommandInteraction<'cached'>
    | MentionableSelectMenuInteraction<'cached'>
    | ModalSubmitInteraction<'cached'>
    | RoleSelectMenuInteraction<'cached'>
    | StringSelectMenuInteraction<'cached'>
  > = async (ctx, _bot, next, props: GuardPropsType) => {
    const eventsmode = await db.query.eventsmodes.findFirst({
      with: { guild: true },
      where: and(
        eq(eventsmodes.isHired, true),
        eq(eventsmodes.guildId, ctx.guild.id),
        eq(eventsmodes.userId, ctx.user.id),
        gte(eventsmodes.permissionRole, role),
      ),
    });

    // (eventsmode && env.OWNER_ID === ctx.user.id)
    if (eventsmode) {
      props.eventsmode = eventsmode;
      props.guild = eventsmode.guild;

      console.log(props.guild);
      return next();
    }

    return await safeReply(
      ctx,
      embedResponse({
        template: BotMessages.PERMISSION_DENIED,
        status: Colors.Danger,
        ephemeral: true,
      }),
    );
  };

  return guard;
};
