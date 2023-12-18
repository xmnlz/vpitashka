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
  TextChannel,
} from 'discord.js';
import { ButtonComponent, Discord, Guard, Slash } from 'discordx';
import { injectable } from 'tsyringe';
import { EventActivity } from '../../feature/event/event-activity/event-activity.entity.js';
import { EventActivityService } from '../../feature/event/event-activity/event-activity.service.js';
import { GlobalEventHistoryService } from '../../feature/event/global-event-history/global-event-history.service.js';
import { WeeklyEventHistoryService } from '../../feature/event/weekly-event-history/weekly-event-history.service.js';
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
    private readonly globalEventHistoryService: GlobalEventHistoryService,
    private readonly weeklyEventHistoryService: WeeklyEventHistoryService,
    private readonly eventsmodeService: EventsmodeService,
    private readonly loggerService: LoggerService,
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

    const eventActivity = await EventActivity.findOne({
      where: { executor: { userId: ctx.member.id, guild: { id: ctx.guild.id } } },
      relations: { guild: { settingsManagement: true } },
    });

    const { isStared, id, event, isPaused, eventTime, voiceChannelId, textChannelId, guild } =
      eventActivity!;

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

    await this.loggerService.log({
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

    if (guild.settingsManagement.isStartedEventCategory) {
      const voiceChannel = ctx.client.channels.cache.get(voiceChannelId) as
        | VoiceChannel
        | undefined;
      const textChannel = ctx.client.channels.cache.get(textChannelId) as TextChannel | undefined;

      if (voiceChannel && textChannel) {
        await voiceChannel.setParent(guild.settingsManagement.startedEventCategoryId);
        await textChannel.setParent(guild.settingsManagement.startedEventCategoryId);
      }
    }

    await ctx.editReply({ embeds: [updatedEmbed] });
  }

  @ButtonComponent({ id: '@button/event-pause-action' })
  async eventPause(ctx: ButtonInteraction<'cached'>) {
    await ctx.deferUpdate();

    const eventActivity = await EventActivity.findOneBy({
      executor: { userId: ctx.member.id, guild: { id: ctx.guild.id } },
    });

    const { id, isPaused, isStared, event } = eventActivity!;

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

    await this.loggerService.log({
      guildId: ctx.guild.id,
      bot: ctx.client,
      message: embedResponse({
        template: `$1 $2 ивент $3`,
        replaceArgs: [
          userWithNameAndId(ctx.user),
          !isPaused ? 'поставил на паузу' : 'снял с паузы',
          event.category + ' | ' + event.name,
        ],
      }),
    });

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

    await this.weeklyEventHistoryService.addWeeklyEventHistory({
      guild: { id: ctx.guild.id },
      event,
      eventsmode: executor,
      startedAt,
      totalTime: eventTime,
      totalSalary: salary,
    });

    await this.globalEventHistoryService.addGlobalEventHistory({
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

    await this.loggerService.log({
      guildId: ctx.guild.id,
      bot: ctx.client,
      message: embedResponse({
        template: `$1 закочил ивент $2 в $3\n$4`,
        replaceArgs: [
          userWithNameAndId(ctx.user),
          event.category + ' | ' + event.name,
          time(~~(new Date().getTime() / 1000)),
          codeBlock('ts', `Время Ивентов: ${eventTime}\nЗарплата: ${salary}`),
        ],
      }),
    });

    await ctx.member
      .send({
        embeds: [
          new EmbedBuilder({
            title: `Ивент ${event.name} был успешно закончен!`,
            description: codeBlock(
              'ts',
              `Зарплата: ${salary}\nВсе проведенное время: ${humanizeMinutes(eventTime)}`,
            ),
          }),
        ],
      })
      .catch(logger.error);
  }
}
