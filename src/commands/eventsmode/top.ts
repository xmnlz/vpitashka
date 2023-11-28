import { codeBlock, CommandInteraction, EmbedBuilder, inlineCode, Snowflake } from 'discord.js';
import { Discord, Guard, Slash } from 'discordx';
import moment from 'moment/moment.js';
import { EventHistory } from '../../feature/event/event-history/event-history.entity.js';
import { EventsmodeGuard } from '../../guards/eventsmode.guard.js';
import { Colors } from '../../lib/constants.js';
import { humanizeMinutes } from '../../lib/humanize-duration.js';
import { interpolate, userWithMentionAndId } from '../../lib/log-formatter.js';
import { chunks, pagination } from '../../lib/pagination.js';

@Discord()
@Guard(EventsmodeGuard)
export class Command {
  @Slash({ description: 'Top eventsmode by week' })
  async top(ctx: CommandInteraction<'cached'>) {
    await ctx.deferReply();

    const eventStatsRaw = await EventHistory.query(
      `
          SELECT sum(total_time) as "totalTime", count(*) as "count"
          FROM public.event_history
          LEFT JOIN guild ON event_history.guild_id = guild.id
          WHERE guild_id = $1 AND started_at BETWEEN $2 AND $3`,
      [ctx.guild.id, moment().startOf('week').toDate(), moment().endOf('week').toDate()],
    );

    const eventStats: { totalTime: number; count: number } = eventStatsRaw[0];

    const test: { userId: Snowflake; totalTime: number; eventCount: number }[] =
      await EventHistory.query(
        `
          SELECT eventsmode.user_id as "userId", eventsmode.total_time as "totalTime", count(*) as "eventCount"
          FROM public.event_history
          LEFT JOIN guild ON event_history.guild_id = guild.id
          LEFT JOIN eventsmode ON event_history.eventsmode_id = eventsmode.id
          GROUP BY eventsmode.user_id, eventsmode.total_time, eventsmode.total_time
          ORDER BY eventsmode.total_time DESC, COUNT(*) DESC
          `,
        [],
      );

    const textChunks = chunks(
      test.map(({ userId, totalTime, eventCount }, index) =>
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
            humanizeMinutes(eventStats.totalTime),
            String(eventStats.count),
          ]),
        ) + `\n${textArray.join('\n')}`,
      );
      return embed;
    });

    await pagination(ctx, embeds);
  }
}
