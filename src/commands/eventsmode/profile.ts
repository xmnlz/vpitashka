import { ApplicationCommandOptionType, CommandInteraction, GuildMember } from 'discord.js';
import { Discord, Guard, Slash, SlashOption } from 'discordx';
import { Eventsmode } from '../../feature/eventsmode/eventsmode.entity.js';
import { EventsmodeGuard } from '../../guards/eventsmode.guard.js';
import { generateEventsmodeProfile } from '../../html/eventsmode-profile/profile.js';
import { BotMessages, Colors } from '../../lib/constants.js';
import { embedResponse } from '../../lib/embed-response.js';
import { CommandError } from '../../lib/errors/command.error.js';
import { humanizeMinutes } from '../../lib/humanize-duration.js';
import { getStuffRole } from '../../lib/log-formatter.js';

@Discord()
@Guard(EventsmodeGuard)
export class Command {
  @Slash({ description: 'Eventsmode profile' })
  async profile(
    @SlashOption({
      description: 'user',
      name: 'user',
      required: false,
      type: ApplicationCommandOptionType.User,
    })
    member: GuildMember | undefined,
    ctx: CommandInteraction<'cached'>,
  ) {
    await ctx.deferReply({ fetchReply: true });

    const author = member || ctx.member;

    const eventsmode = await Eventsmode.findOneBy({
      guild: { id: author.guild.id },
      userId: author.id,
      isHired: true,
    });

    if (!eventsmode) {
      throw new CommandError({
        ctx,
        content: embedResponse({
          template: BotMessages.EVENTSMODE_NOT_EXISTS,
          status: Colors.DANGER,
          ephemeral: true,
        }),
      });
    }

    const rawUserTop = await Eventsmode.query(
      `
          SELECT top FROM (
          SELECT user_id, is_hired, RANK() OVER (ORDER BY weekly_time DESC) as top
          FROM public.eventsmode) AS x
          WHERE user_id = $1 AND is_hired = TRUE`,
      [author.id],
    );

    const { minimumWeeklyQuota } = eventsmode.guild.settingsManagement;

    const percentageBar = ~~((eventsmode.weeklyTime / minimumWeeklyQuota) * 100);

    const buffer = await generateEventsmodeProfile({
      user: {
        nickname: author.user.username,
        avatar: author.user.avatarURL({ forceStatic: true }) ?? '',
        staffRole: getStuffRole(eventsmode.staffRole),
      },
      stats: {
        totalTime: humanizeMinutes(eventsmode.totalTime),
        totalSalary: eventsmode.totalSalary,
        weeklyTime: humanizeMinutes(eventsmode.weeklyTime),
        weeklySalary: eventsmode.weeklySalary,
        warns: eventsmode.warns.filter((warn) => !warn.isVerbal).length,
        date: eventsmode.hiredAt.toDateString(),

        favoriteEvent: eventsmode.favoriteEvent,
        longestEvent: humanizeMinutes(eventsmode.longestEvent),

        hearts: eventsmode.hearts,

        top: rawUserTop[0].top,

        percentage: percentageBar,
      },
    });

    await ctx.editReply({ files: [buffer] });
  }
}
