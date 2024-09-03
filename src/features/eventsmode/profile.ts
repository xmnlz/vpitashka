import {
  ApplicationCommandOptionType,
  AttachmentBuilder,
  CommandInteraction,
  GuildMember,
} from 'discord.js';
import { Discord, Guard, Slash, SlashOption } from 'discordx';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../database/data-source';
import { PermissionRole } from '../../guards/permission-role.guard';
// import { generateEventsmodeProfile } from '../../html/eventsmode-profile/profile';
import { BotMessages, Colors } from '../../lib/constants';
import { embedResponse } from '../../lib/embed-response';
import { safeReply } from '../../lib/safe-reply';
import { permissionToString } from '../../lib/string-utils';
import { humanizeSeconds } from '../../lib/time-utils';
import { eventsmodes, permissionRole } from '../../schemas/eventsmodes';
import { guilds } from '../../schemas/guilds';

@Discord()
@Guard(PermissionRole(permissionRole.eventsmode))
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

    const eventsmode = await db.query.eventsmodes.findFirst({
      with: { guild: true, warns: true },
      where: and(
        eq(eventsmodes.userId, author.id),
        eq(eventsmodes.guildId, ctx.guild.id),
        eq(eventsmodes.isHired, true),
      ),
    });

    if (!eventsmode) {
      return await safeReply(
        ctx,
        embedResponse({
          template: BotMessages.EVENTSMODE_NOT_EXISTS,
          status: Colors.Danger,
          ephemeral: true,
        }),
      );
    }

    const rawUserTop = await db.execute<{ top: number }>(sql`SELECT top FROM (
        SELECT ${eventsmodes.userId}, RANK() OVER (ORDER BY ${eventsmodes.weeklyTime} DESC) as top
        FROM ${eventsmodes}
        LEFT JOIN ${guilds} ON ${eventsmodes.guildId} = ${guilds.id}
        WHERE ${eventsmodes.guildId} = ${ctx.guild.id} AND ${eventsmodes.isHired} = TRUE
    ) AS sq WHERE "user_id" = ${author.id}`);

    const { minimumWeeklyQuota } = eventsmode.guild.protoSettings.general;

    const percentageBar = ~~((eventsmode.weeklyTime / minimumWeeklyQuota) * 100);

    // const buffer = await generateEventsmodeProfile({
    //   user: {
    //     nickname: author.user.username,
    //     avatar: author.user.avatarURL({ forceStatic: true, size: 1024 }) ?? '',
    //     staffRole: permissionToString(eventsmode.permissionRole),
    //   },
    //   stats: {
    //     totalTime: humanizeSeconds(eventsmode.totalTime),
    //     totalSalary: eventsmode.totalSalary,
    //     weeklyTime: humanizeSeconds(eventsmode.weeklyTime),
    //     weeklySalary: eventsmode.weeklySalary,
    //     warns: eventsmode.warns.filter((warn) => !warn.isVerbal).length,
    //     date: eventsmode.hiredAt.toDateString(),
    //
    //     favoriteEvent: eventsmode.favoriteEvent,
    //     longestEvent: humanizeSeconds(eventsmode.longestEvent),
    //
    //     hearts: eventsmode.hearts,
    //
    //     top: rawUserTop.rows[0].top,
    //
    //     percentage: percentageBar >= 100 ? 100 : percentageBar,
    //   },
    // });
    //
    // await ctx.editReply({
    //   files: [new AttachmentBuilder(buffer, { name: `p-${eventsmode.id}.png` })],
    // });
  }
}
