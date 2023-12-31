import { codeBlock, CommandInteraction, EmbedBuilder, Snowflake } from 'discord.js';
import { Discord, Guard, Slash } from 'discordx';
import { injectable } from 'tsyringe';
import { WeeklyEventHistory } from '../../feature/event/weekly-event-history/weekly-event-history.entity.js';
import { Eventsmode } from '../../feature/eventsmode/eventsmode.entity.js';
import { EventsmodeService } from '../../feature/eventsmode/eventsmode.service.js';
import { LoggerService } from '../../feature/guild/guild-logger.service.js';
import { ModeratorGuard } from '../../guards/moderator.guard.js';
import { Colors } from '../../lib/constants.js';
import { embedResponse } from '../../lib/embed-response.js';
import { CommandError } from '../../lib/errors/command.error.js';
import { humanizeMinutes } from '../../lib/humanize-duration.js';
import { interpolate, userWithMentionAndId, userWithNameAndId } from '../../lib/log-formatter.js';
import { chunks } from '../../lib/pagination.js';

@Discord()
@injectable()
@Guard(ModeratorGuard)
export class Command {
  constructor(
    private readonly eventsmodeService: EventsmodeService,
    private readonly loggerService: LoggerService,
  ) {}
  @Slash({ description: 'Reset weekly statistics' })
  async reset(ctx: CommandInteraction<'cached'>) {
    await ctx.deferReply();

    await this.loggerService.log({
      guildId: ctx.guild.id,
      bot: ctx.client,
      message: embedResponse({
        template: `$1 сбросил неделную статистику`,
        replaceArgs: [userWithNameAndId(ctx.user)],
      }),
    });

    const rawTopWeekUser = await Eventsmode.query(
      `
          SELECT user_id, top FROM (
          SELECT user_id, is_hired, RANK() OVER (ORDER BY weekly_time DESC) as top
          FROM public.eventsmode) AS x
          WHERE is_hired = TRUE
          LIMIT 1`,
    );

    const title = `Статистика за неделю`;

    const topWeekUserId: string = rawTopWeekUser[0].user_id;

    const eventsmode: {
      userId: Snowflake;
      weeklyTime: number;
      weeklySalary: number;
      eventCount: number;
    }[] = await WeeklyEventHistory.query(
      `
          SELECT eventsmode.user_id as "userId",
                 eventsmode.weekly_time as "weeklyTime",
                 eventsmode.weekly_salary as "weeklySalary",
                 count(*) as "eventCount"
          FROM public.weekly_event_history
          LEFT JOIN guild ON weekly_event_history.guild_id = guild.id
          LEFT JOIN eventsmode ON weekly_event_history.eventsmode_id = eventsmode.id
          WHERE weekly_event_history.guild_id = $1 
          GROUP BY eventsmode.user_id, eventsmode.weekly_time, eventsmode.weekly_salary
          ORDER BY eventsmode.weekly_time DESC, COUNT(*) DESC
          `,
      [ctx.guild.id],
    );

    if (!eventsmode.length) {
      throw new CommandError({
        ctx,
        content: embedResponse({
          template: `Статистика пуста.`,
          replaceArgs: [],
          ephemeral: true,
          status: Colors.DANGER,
        }),
      });
    }

    const generalStatistics = `Топ 1 за неделю: ${userWithMentionAndId(topWeekUserId)}`;

    const textChunks = chunks(
      eventsmode.map(({ userId, weeklyTime, weeklySalary, eventCount }, index) =>
        interpolate(
          `${index + 1}. $1 - Недельная Зарплата: $2, Время за неделю: $3, Количество ивентов: $4`,
          [
            userWithMentionAndId(userId),
            weeklyTime.toString(),
            humanizeMinutes(weeklySalary),
            eventCount.toString(),
          ],
        ),
      ),
      35,
    );

    const embeds = textChunks.map((textArray) => {
      const embed = new EmbedBuilder();
      embed.setColor(Colors.INFO);
      embed.setDescription(codeBlock(title) + generalStatistics + `\n${textArray.join('\n')}`);
      return embed;
    });

    await this.loggerService.log({
      guildId: ctx.guild.id,
      bot: ctx.client,
      message: { embeds },
    });

    await this.eventsmodeService.resetWeekly(ctx.guild.id);

    await ctx.editReply({ content: 'Недельная статистика была успешно сброшенна! ' });
  }
}
