import { CommandInteraction, EmbedBuilder, userMention } from 'discord.js';
import { Discord, Guard, Slash } from 'discordx';
import { WeeklyEventHistory } from '../../feature/event/weekly-event-history/weekly-event-history.entity.js';
import { EventsmodeGuard } from '../../guards/eventsmode.guard.js';
import { Colors } from '../../lib/constants.js';
import { embedResponse } from '../../lib/embed-response.js';
import { CommandError } from '../../lib/errors/command.error.js';
import { humanizeMinutes } from '../../lib/humanize-duration.js';
import { interpolate } from '../../lib/log-formatter.js';
import { chunks, pagination } from '../../lib/pagination.js';

@Discord()
@Guard(EventsmodeGuard)
export class Command {
  @Slash({ description: 'All events by week' })
  async weekly(ctx: CommandInteraction<'cached'>) {
    await ctx.deferReply({ ephemeral: true });

    const eventHistory = await WeeklyEventHistory.find({
      order: { totalTime: 'DESC' },
      where: {
        guild: { id: ctx.guild.id },
      },
    });

    if (!eventHistory.length)
      throw new CommandError({
        ctx,
        content: embedResponse({
          template: 'Пока история ивентов пуста, возможно стоит что то провести?',
          status: Colors.DANGER,
          ephemeral: true,
        }),
      });

    const textChunks = chunks(
      eventHistory.map(({ eventsmode, totalTime, totalSalary, event }, index) =>
        interpolate(`${index + 1}. $1 | Event: $2 | Time: $3 | Salary: $4`, [
          userMention(eventsmode.userId),
          event.name,
          humanizeMinutes(totalTime),
          totalSalary.toString(),
        ]),
      ),
      15,
    );

    const embeds = textChunks.map((textArray) => {
      const embed = new EmbedBuilder();
      embed.setColor(Colors.INVISIBLE);
      embed.setDescription(textArray.join('\n'));
      return embed;
    });

    return pagination(ctx, embeds);
  }
}
