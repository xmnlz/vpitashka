import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  channelMention,
  CommandInteraction,
  EmbedBuilder,
  type MessageActionRowComponentBuilder,
  time,
} from 'discord.js';
import { Client, Discord, Guard, Slash } from 'discordx';
import { and, eq } from 'drizzle-orm';
import { db } from '../../database/data-source';

import { type GuardPropsType, PermissionRole } from '../../guards/permission-role.guard';
import { Colors } from '../../lib/constants';
import { embedResponse } from '../../lib/embed-response';
import { safeReply } from '../../lib/safe-reply';
import { humanizeMinutes } from '../../lib/time-utils';
import { eventActivities } from '../../schemas/event-activities';
import { permissionRole } from '../../schemas/eventsmodes';

@Discord()
@Guard(PermissionRole(permissionRole.eventsmode))
export class Command {
  @Slash({ description: 'Managing active events via panel' })
  async panel(ctx: CommandInteraction<'cached'>, _: Client, props: GuardPropsType) {
    await ctx.deferReply({ ephemeral: true });

    const eventActivity = await db.query.eventActivities.findFirst({
      with: { event: true, eventsmode: true },
      where: and(eq(eventActivities.eventsmodeId, props.eventsmode.id)),
    });

    if (!eventActivity) {
      return await safeReply(
        ctx,
        embedResponse({
          template: 'У вас нет активного ивента.',
          status: Colors.Danger,
          ephemeral: true,
        }),
      );
    }

    const eventPanel = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new ButtonBuilder()
        .setEmoji('⏩')
        .setStyle(ButtonStyle.Secondary)
        .setCustomId('@button/event-start-action'),
      new ButtonBuilder()
        .setEmoji('⏸️')
        .setStyle(ButtonStyle.Secondary)
        .setCustomId('@button/event-pause-action'),
      new ButtonBuilder()
        .setEmoji('⏺️')
        .setStyle(ButtonStyle.Secondary)
        .setCustomId('@button/event-end-action'),
    );

    const { textChannelId, voiceChannelId, eventTime, event, isStared, startedAt, isPaused } =
      eventActivity;

    const eventPanelStatusEmbed = new EmbedBuilder()
      .setColor(Colors.Invisible)
      .setAuthor({ name: 'Event Activity Info', iconURL: ctx.user.displayAvatarURL() })
      .setFields([
        { name: 'Название Ивента', value: `${event.name} | ${event.category}`, inline: true },
        { name: 'Text Channel', value: channelMention(textChannelId), inline: true },
        { name: 'Voice Channel', value: channelMention(voiceChannelId), inline: true },
      ]);

    if (isStared) {
      eventPanelStatusEmbed.addFields([
        { name: 'Время Ивента', value: humanizeMinutes(eventTime), inline: true },
        {
          name: 'Начало Ивента',
          value: time(~~(startedAt.getTime() / 1000)),
          inline: true,
        },
        {
          name: 'Статус Ивента',
          value: `${isPaused ? 'On Pause' : 'Going on'}`,
          inline: true,
        },
      ]);
    }

    await ctx.editReply({
      embeds: [eventPanelStatusEmbed],
      components: [eventPanel],
    });
  }
}
