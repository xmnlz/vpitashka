import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  channelMention,
  CommandInteraction,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
  codeBlock,
  VoiceChannel,
  time,
  bold,
} from 'discord.js';
import { ButtonComponent, Discord, Guard, Slash } from 'discordx';
import { injectable } from 'tsyringe';
import { EventActivity } from '../../feature/event/event-activity/event-activity.entity.js';
import { EventActivityService } from '../../feature/event/event-activity/event-activity.service.js';
import { EventHistoryService } from '../../feature/event/event-history/event-history.service.js';
import { EventsmodeService } from '../../feature/eventsmode/eventsmode.service.js';
import { LoggerService } from '../../feature/guild/guild-logger.service.js';
import { EventsmodeGuard } from '../../guards/eventsmode.guard.js';
import { Colors } from '../../lib/constants.js';
import { embedResponse } from '../../lib/embed-response.js';
import { CommandError } from '../../lib/errors/command.error.js';
import { humanizeMinutes } from '../../lib/humanize-duration.js';
import { userWithNameAndId } from '../../lib/log-formatter.js';
import { logger } from '../../lib/logger.js';

@Discord()
@injectable()
@Guard(EventsmodeGuard)
export class Command {
  constructor(
    private readonly eventActivityService: EventActivityService,
    private readonly eventHistoryService: EventHistoryService,
    private readonly eventsmodeService: EventsmodeService,
    private readonly LoggerService: LoggerService,
  ) {}

  @Slash({ description: 'Managing active events via panel' })
  async panel(ctx: CommandInteraction<'cached'>) {
    await ctx.deferReply({ ephemeral: true });

    const eventActivity = await EventActivity.findOneBy({
      executor: { userId: ctx.user.id, guild: { id: ctx.guild.id } },
    });

    if (!eventActivity) {
      throw new CommandError({
        ctx,
        content: embedResponse({
          template: `You dont have any active events yet`,
          status: Colors.DANGER,
          ephemeral: true,
        }),
      });
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
      .setColor(Colors.INVISIBLE)
      .setAuthor({ name: 'Event Activity Info', iconURL: ctx.user.displayAvatarURL() })
      .setFields([
        { name: 'Event Name', value: `${event.name} | ${event.category}`, inline: true },
        { name: 'Text Channel', value: channelMention(textChannelId), inline: true },
        { name: 'Voice Channel', value: channelMention(voiceChannelId), inline: true },
      ]);

    if (isStared) {
      eventPanelStatusEmbed.addFields([
        { name: 'Event Time', value: humanizeMinutes(eventTime), inline: true },
        {
          name: 'Event Started At',
          value: time(~~(startedAt.getTime() / 1000)),
          inline: true,
        },
        {
          name: 'Event Pause',
          value: `Status: ${isPaused ? 'On Pause' : 'Going on'}`,
          inline: true,
        },
      ]);
    }

    await ctx.editReply({
      embeds: [eventPanelStatusEmbed],
      components: [eventPanel],
    });
  }

  @ButtonComponent({ id: '@button/event-start-action' })
  async eventStart(ctx: ButtonInteraction<'cached'>) {
    await ctx.deferUpdate();

    const eventActivity = await EventActivity.findOneBy({
      executor: { userId: ctx.member.id, guild: { id: ctx.guild.id } },
    });

    const { isStared, id, event, isPaused, eventTime, voiceChannelId } = eventActivity!;

    if (isStared) {
      throw new CommandError({
        ctx,
        content: embedResponse({
          template: 'You already have a started event.',
          status: Colors.DANGER,
          ephemeral: true,
        }),
      });
    }

    await this.eventActivityService.startEventActivity(id);

    const mess = ctx.message;

    const updatedEmbed = new EmbedBuilder(mess.embeds[0].data).addFields([
      { name: 'Event Time', value: humanizeMinutes(eventTime), inline: true },
      {
        name: 'Event Started At',
        value: time(~~(new Date().getTime() / 1000)),
        inline: true,
      },
      {
        name: 'Event Pause',
        value: `Status: ${isPaused ? 'On Pause' : 'Going on'}`,
        inline: true,
      },
    ]);

    const voiceChannel = ctx.guild.channels.cache.get(voiceChannelId) as VoiceChannel;

    const members = voiceChannel.members.filter((m) => m.id !== ctx.member.id).map((m) => m);

    await this.LoggerService.log({
      guildId: ctx.guild.id,
      bot: ctx.client,
      message: embedResponse({
        template: `$1 запустил ивент $2\nУчастиники Ивента: \n$3`,
        replaceArgs: [
          userWithNameAndId(ctx.user),
          bold(event.name),
          !members.length
            ? bold('пусто.')
            : codeBlock(members.map((m) => `${m.user.username} (${m.user.id})`).join('\n')),
        ],
      }),
    });

    await ctx.editReply({ embeds: [updatedEmbed] });
  }

  @ButtonComponent({ id: '@button/event-pause-action' })
  async eventPause(ctx: ButtonInteraction<'cached'>) {
    await ctx.deferUpdate();

    const eventActivity = await EventActivity.findOneBy({
      executor: { userId: ctx.member.id, guild: { id: ctx.guild.id } },
    });

    const { id, isPaused, isStared } = eventActivity!;

    await this.eventActivityService.pauseEventActivity(id, isPaused);

    if (!isStared) {
      throw new CommandError({
        ctx,
        content: embedResponse({
          template: 'You need to start event first, then use pause.',
          status: Colors.DANGER,
          ephemeral: true,
        }),
      });
    }

    ctx.message.embeds[0].fields.pop();

    ctx.message.embeds[0].fields.push({
      name: 'Event Pause',
      value: `Status: ${!isPaused ? 'On Pause' : 'Going on'}`,
      inline: true,
    });

    const updatedEmbed = new EmbedBuilder(ctx.message.embeds[0].data).setFields(
      ...ctx.message.embeds[0].fields,
    );

    await ctx.editReply({ embeds: [updatedEmbed] });
  }

  @ButtonComponent({ id: '@button/event-end-action' })
  async eventEnd(ctx: ButtonInteraction<'cached'>) {
    await ctx.deferUpdate();

    const eventActivity = await EventActivity.findOneBy({
      executor: { userId: ctx.member.id, guild: { id: ctx.guild.id } },
    });

    const {
      id,
      isPaused,
      event,
      isStared,
      voiceChannelId,
      textChannelId,
      executor,
      startedAt,
      eventTime,
    } = eventActivity!;

    if (!isStared) {
      throw new CommandError({
        ctx,
        content: embedResponse({
          template: 'You need to start event first, then use pause.',
          status: Colors.DANGER,
          ephemeral: true,
        }),
      });
    }

    if (isPaused) {
      throw new CommandError({
        ctx,
        content: embedResponse({
          template: 'Your event is currently pause, unpause then try to end it.',
          status: Colors.DANGER,
          ephemeral: true,
        }),
      });
    }

    await this.eventActivityService.deleteEventActivity(id);

    const salary = ~~(eventTime * event.multiplayer);

    await this.eventsmodeService.editStatistics(executor.userId, executor.guild.id, {
      weeklySalary: salary,
      totalSalary: salary,
    });

    if (executor.longestEvent === 0 || eventTime > executor.longestEvent) {
      await this.eventsmodeService.editStatistics(executor.userId, executor.guild.id, {
        longestEvent: eventTime,
      });
    }

    await this.eventHistoryService.addEventHistory({
      guild: { id: ctx.guild.id },
      event,
      eventsmode: executor,
      startedAt,
      totalTime: eventTime,
      totalSalary: salary,
    });

    const mess = ctx.message;

    mess.embeds[0].fields.splice(mess.embeds[0].fields.length - 3, 3);

    const updatedEmbed = new EmbedBuilder(mess.embeds[0].data).addFields([
      { name: 'Event Time', value: humanizeMinutes(eventTime), inline: true },
      { name: 'Event Salary', value: salary.toString(), inline: true },
    ]);

    await ctx.editReply({ embeds: [updatedEmbed], components: [] });

    await ctx.guild.channels.delete(voiceChannelId).catch(logger.error);
    await ctx.guild.channels.delete(textChannelId).catch(logger.error);

    await ctx.member
      .send({
        embeds: [
          new EmbedBuilder({
            title: `Event ${event.name} was successfully ended!`,
            description: codeBlock(
              'ts',
              `Salary: ${salary}\nTotal Event Time: ${humanizeMinutes(eventTime)}`,
            ),
          }),
        ],
      })
      .catch(logger.error);
  }
}
