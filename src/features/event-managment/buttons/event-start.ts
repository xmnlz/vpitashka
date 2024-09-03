import {
  ActionRowBuilder,
  ButtonInteraction,
  CategoryChannel,
  ChannelType,
  ComponentType,
  type MessageActionRowComponentBuilder,
  StringSelectMenuBuilder,
  OverwriteType,
  EmbedBuilder,
  inlineCode,
} from 'discord.js';

import { ButtonComponent, type Client, Discord, Guard } from 'discordx';
import { and, eq } from 'drizzle-orm';
import { db } from '../../../database/data-source';
import { PermissionRole } from '../../../guards/permission-role.guard';
import type { GuardPropsType } from '../../../guards/permission-role.guard';
import { BotMessages, Colors } from '../../../lib/constants';
import { embedResponse } from '../../../lib/embed-response';
import { logger } from '../../../lib/logger';
import { permissionForChannels } from '../../../lib/permission-for-channels';
import { safeReply } from '../../../lib/safe-reply';
import { userWithMentionAndId } from '../../../lib/string-utils';
import { eventActivities } from '../../../schemas/event-activities';
import { eventBans } from '../../../schemas/event-bans';
import { events } from '../../../schemas/events';
import { permissionRole } from '../../../schemas/eventsmodes';
import { globalEventBan } from '../../../schemas/global-event-ban';

@Discord()
@Guard(PermissionRole(permissionRole.administrator))
export class Button {
  @ButtonComponent({ id: '@action/start-event' })
  async startEventAction(ctx: ButtonInteraction<'cached'>, _: Client, props: GuardPropsType) {
    await ctx.deferReply({ ephemeral: true });

    const eventActivity = await db.query.eventActivities.findFirst({
      with: { event: true, eventsmode: true },
      where: and(
        eq(eventActivities.eventsmodeId, props.eventsmode.id),
        eq(eventActivities.guildId, ctx.guild.id),
      ),
    });

    if (eventActivity) {
      return await safeReply(
        ctx,
        embedResponse({
          template: 'You already have an active event going on.',
          status: Colors.Danger,
          ephemeral: true,
        }),
      );
    }

    const { eventCategoryId } = props.guild.protoSettings.channels;

    if (!eventCategoryId) {
      return await safeReply(
        ctx,
        embedResponse({
          template: 'Settings issues',
          status: Colors.Danger,
          ephemeral: true,
        }),
      );
    }

    const allEvents = await db.query.events.findMany({
      where: eq(events.guildId, ctx.guild.id),
    });

    if (!allEvents.length) {
      return await safeReply(
        ctx,
        embedResponse({
          template: BotMessages.EVENT_LIST_EMPTY,
          status: Colors.Danger,
          ephemeral: true,
        }),
      );
    }

    const allCategory = [...new Set(allEvents.map(({ category }) => category))];

    const categorySelectMenuRow =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('@select/choose-event-category')
          .setPlaceholder('Choose event category')
          .addOptions(
            allCategory.map((value) => {
              return { label: value, value };
            }),
          ),
      );

    const categorySelectMessage = await ctx.editReply({
      components: [categorySelectMenuRow],
    });

    const categorySelectInteraction = await categorySelectMessage
      .awaitMessageComponent({
        componentType: ComponentType.StringSelect,
        time: 15_000,
      })
      .catch();

    await categorySelectInteraction.deferReply({ ephemeral: true });

    const eventCategory = categorySelectInteraction.values[0];

    const eventSelectMenuRow =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('@select/choose-event')
          .setPlaceholder('Choose event by name')
          .addOptions(
            allEvents
              .filter((event) => event.category === eventCategory)
              .map(({ name, id }) => {
                return { label: name, value: id };
              }),
          ),
      );

    const eventSelectMessage = await categorySelectInteraction.editReply({
      components: [eventSelectMenuRow],
    });

    const eventSelectInteraction = await eventSelectMessage
      .awaitMessageComponent({
        componentType: ComponentType.StringSelect,
        time: 15_000,
      })
      .catch();

    await eventSelectInteraction.deferReply({ ephemeral: true });

    const eventId = eventSelectInteraction.values[0];

    const [event] = allEvents.filter(
      (event) => event.category === eventCategory && event.id === eventId,
    );

    await eventSelectInteraction.editReply(JSON.stringify(event));

    const eventCategoryChannel = eventSelectInteraction.guild.channels.cache.get(
      eventCategoryId,
    ) as CategoryChannel | undefined;

    if (!eventCategoryChannel) {
      return await safeReply(
        ctx,
        embedResponse({
          template: 'Try again, bot cant fetch a channel',
          status: Colors.Danger,
          ephemeral: true,
        }),
      );
    }

    const eventBansList = await db.query.eventBans.findMany({
      with: { target: true },
      where: and(
        eq(eventBans.executorId, props.eventsmode.id),
        eq(eventBans.guildId, ctx.guild.id),
      ),
    });

    const eventVoiceChannelRaw = await eventCategoryChannel.children.create({
      name: event.name,
      userLimit: 10,
      type: ChannelType.GuildVoice,
      position: 0,
    });

    const eventTextChannelRaw = await eventCategoryChannel.children.create({
      name: event.name,
      type: ChannelType.GuildText,
    });

    const eventVoiceChannel = await eventVoiceChannelRaw.lockPermissions();
    const eventTextChannel = await eventTextChannelRaw.lockPermissions();

    await permissionForChannels(
      [eventVoiceChannel, eventTextChannel],
      ctx.user.id,
      {
        ManageRoles: true,
        ManageChannels: true,
        SendMessages: true,
        ViewChannel: true,
      },
      { type: OverwriteType.Member },
    );

    if (eventBansList.length) {
      for (const { target } of eventBansList) {
        await permissionForChannels(
          [eventVoiceChannel, eventTextChannel],
          target.userId,
          {
            Speak: false,
            Connect: false,
            SendMessages: false,
          },
          { type: OverwriteType.Member },
        );
      }
    }

    const globalEventBans = await db.query.globalEventBan.findMany({
      where: eq(globalEventBan.guildId, ctx.guild.id),
    });

    if (globalEventBans.length) {
      for (const { target } of eventBansList) {
        await permissionForChannels(
          [eventVoiceChannel, eventTextChannel],
          target.userId,
          {
            Speak: false,
            Connect: false,
            SendMessages: false,
          },
          { type: OverwriteType.Member },
        );
      }
    }

    await permissionForChannels(
      [eventTextChannel],
      ctx.guild.roles.everyone,
      { SendMessages: false },
      { type: OverwriteType.Role },
    );

    await db.insert(eventActivities).values({
      eventId: event.id,
      guildId: ctx.guild.id,
      eventsmodeId: props.eventsmode.id,
      voiceChannelId: eventVoiceChannel.id,
      textChannelId: eventTextChannel.id,
    });

    await eventSelectInteraction.editReply({
      content: 'Ивент был успешно создан!',
      components: [],
    });

    const eventStatsEmbed = new EmbedBuilder().setDescription(
      `${userWithMentionAndId(ctx.user.id)}, ${inlineCode(event.name)}`,
    );

    await eventTextChannel
      .send({ embeds: [eventStatsEmbed] })
      .then(async (msg) => await msg.pin())
      .catch();

    await eventTextChannel
      .send(event.startEmbed ? event.startEmbed : { content: BotMessages.SOMETHING_GONE_WRONG })
      .then(async (msg) => await msg.pin())
      .catch(logger.error);
  }
}
