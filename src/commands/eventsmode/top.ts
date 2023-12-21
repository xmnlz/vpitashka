import { codeBlock, CommandInteraction, EmbedBuilder, inlineCode, Snowflake } from 'discord.js';
import { Discord, Guard, Slash } from 'discordx';
import { WeeklyEventHistory } from '../../feature/event/weekly-event-history/weekly-event-history.entity.js';
import { Eventsmode } from '../../feature/eventsmode/eventsmode.entity.js';
import { EventsmodeGuard } from '../../guards/eventsmode.guard.js';
import { Colors } from '../../lib/constants.js';
import { embedResponse } from '../../lib/embed-response.js';
import { CommandError } from '../../lib/errors/command.error.js';
import { humanizeMinutes } from '../../lib/humanize-duration.js';
import { interpolate, userWithMentionAndId } from '../../lib/log-formatter.js';
import { chunks, pagination } from '../../lib/pagination.js';

@Discord()
@Guard(EventsmodeGuard)
export class Command {
  @Slash({ description: 'Top eventsmode by week' })
  async top(ctx: CommandInteraction<'cached'>) {
    await ctx.deferReply();

    const eventCountByWeek = await WeeklyEventHistory.count({
      where: { guild: { id: ctx.guild.id } },
    });

    const totalEventTimeByWeekRaw = await Eventsmode.query(
      `
        SELECT sum(eventsmode.weekly_time) as "totalTime"
        FROM public.eventsmode
        LEFT JOIN guild ON eventsmode.guild_id = guild.id
        WHERE eventsmode.guild_id = $1 AND eventsmode.is_hired = TRUE
      `,
      [ctx.guild.id],
    );

    const totalEventTimeByWeek = totalEventTimeByWeekRaw[0].totalTime;

    const eventsmodeStats: { userId: Snowflake; totalTime: number; eventCount: number }[] =
      await WeeklyEventHistory.query(
        `
          SELECT eventsmode.user_id as "userId", eventsmode.weekly_time as "totalTime", count(*) as "eventCount"
          FROM public.weekly_event_history
          LEFT JOIN guild ON weekly_event_history.guild_id = guild.id
          LEFT JOIN eventsmode ON weekly_event_history.eventsmode_id = eventsmode.id
          WHERE weekly_event_history.guild_id = $1
          GROUP BY eventsmode.user_id, eventsmode.weekly_time
          ORDER BY eventsmode.weekly_time DESC, COUNT(*) DESC
          `,
        [ctx.guild.id],
      );

    if (!eventsmodeStats.length) {
      throw new CommandError({
        ctx,
        content: embedResponse({
          template: 'Тут пока что пусто.',
          status: Colors.DANGER,
        }),
      });
    }

    const textChunks = chunks(
      eventsmodeStats.map(({ userId, totalTime, eventCount }, index) =>
        interpolate(`${index + 1}. $1 - Время: $2, Ивенты: $3`, [
          userWithMentionAndId(userId),
          inlineCode(humanizeMinutes(totalTime)),
          inlineCode(String(eventCount)),
        ]),
      ),
      10,
    );

    const embeds = textChunks.map((textArray) => {
      const embed = new EmbedBuilder();
      embed.setColor(Colors.INFO);
      embed.setDescription(
        codeBlock(
          'ts',
          interpolate(`Топ ивентеров за неделю\nОбщее Время: $1\nОбщее Кол-во Ивентов: $2`, [
            humanizeMinutes(totalEventTimeByWeek || 0),
            String(eventCountByWeek),
          ]),
        ) + `\n${textArray.join('\n')}`,
      );
      return embed;
    });

    await pagination(ctx, embeds);
  }
}
