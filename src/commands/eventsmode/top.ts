import { ApplicationCommandOptionType, CommandInteraction, EmbedBuilder } from 'discord.js';
import { Discord, Guard, SlashGroup, Slash, SlashOption, SlashChoice } from 'discordx';
import { injectable } from 'tsyringe';
import { Eventsmode } from '../../feature/eventsmode/eventsmode.entity.js';
import { EventsmodeGuard } from '../../guards/eventsmode.guard.js';
import { Colors } from '../../lib/constants.js';
import { chunks, pagination } from '../../lib/pagination.js';

export enum TopOptions {
  TIME = 'time',
  SALARY = 'salary',
}

@Discord()
@injectable()
@Guard(EventsmodeGuard)
@SlashGroup({ description: 'view all tops', name: 'top' })
export class Command {
  @SlashGroup('top')
  @Slash({ description: 'top eventsmode by week' })
  async week(
    @SlashChoice(TopOptions.SALARY, TopOptions.TIME)
    @SlashOption({
      description: 'пользователь',
      name: 'type',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    type: TopOptions.SALARY | TopOptions.TIME,
    ctx: CommandInteraction<'cached'>,
  ) {
    const eventsmode =
      type === TopOptions.TIME
        ? await Eventsmode.find({
            where: { guild: { id: ctx.guild.id }, isHired: true },
            order: { weeklyTime: 'DESC' },
            select: { userId: true, weeklyTime: true },
          })
        : await Eventsmode.find({
            where: { guild: { id: ctx.guild.id }, isHired: true },
            order: { weeklySalary: 'DESC' },
            select: { userId: true, weeklySalary: true },
          });

    const salaryOrTimeSum =
      type === TopOptions.TIME
        ? await Eventsmode.sum('weeklyTime', { guild: { id: ctx.guild.id }, isHired: true })
        : await Eventsmode.sum('weeklySalary', { guild: { id: ctx.guild.id }, isHired: true });

    const textChunks = chunks(
      eventsmode.map(({ userId, weeklyTime, weeklySalary }, index) => {
        const weekly = weeklySalary || weeklyTime;

        return `**${index + 1}.** <@${userId}> ${weekly}`;
      }),
      10,
    );

    const status =
      type === TopOptions.TIME ? `времени | ${salaryOrTimeSum}` : `зарплате | ${salaryOrTimeSum}`;

    const embeds = textChunks.map((textArray) => {
      const embed = new EmbedBuilder();
      embed.setTitle(`Топ ивентеров по ${status}`);
      embed.setColor(Colors.INVISIBLE);
      embed.setDescription(textArray.join('\n'));
      return embed;
    });

    return pagination(ctx, embeds);
  }
}
