import {
  ApplicationCommandOptionType,
  CommandInteraction,
  EmbedBuilder,
  GuildMember,
} from 'discord.js';
import { Discord, Guard, Slash, SlashOption } from 'discordx';
import { db } from '../../database/data-source';
import { PermissionRole } from '../../guards/permission-role.guard';
import { Colors } from '../../lib/constants';
import { embedResponse } from '../../lib/embed-response';
import { chunks, pagination } from '../../lib/pagination';
import { safeReply } from '../../lib/safe-reply';
import { interpolate, userWithNameAndId } from '../../lib/string-utils';
import { humanizeMinutes } from '../../lib/time-utils';
import { eventHistory } from '../../schemas/event-history';
import { eventsmodes, permissionRole } from '../../schemas/eventsmodes';
import { and, eq } from 'drizzle-orm';

@Discord()
@Guard(PermissionRole(permissionRole.eventsmode))
export class Command {
  @Slash({ description: 'Eventsmode all/weekly history' })
  async history(
    @SlashOption({
      description: 'user',
      name: 'user',
      required: false,
      type: ApplicationCommandOptionType.User,
    })
    member: GuildMember | undefined,
    @SlashOption({
      description: 'weekly',
      name: 'weekly',
      required: false,
      type: ApplicationCommandOptionType.Boolean,
    })
    weekly: boolean,
    ctx: CommandInteraction<'cached'>,
  ) {
    await ctx.deferReply({ ephemeral: true });

    const author = member || ctx.member;

    const eventsmode = await db.query.eventsmodes.findFirst({
      columns: { id: true },
      with: { guild: true },
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
          template: `$1 не ивентсомд `,
          replaceArgs: [userWithNameAndId(author.user)],
          ephemeral: true,
          status: Colors.Danger,
        }),
      );
    }

    const eventsmodeEventHistory = await db.query.eventHistory.findMany({
      with: { event: true },
      where: and(
        eq(eventHistory.eventsmodeId, eventsmode.id),
        eq(eventHistory.guildId, ctx.guild.id),
        eq(eventHistory.type, weekly ? 'weekly' : 'global'),
      ),
    });

    if (!eventsmodeEventHistory.length) {
      const content = embedResponse({
        template: `$1 не запускал(а) никаких ивенто пока что.`,
        replaceArgs: [userWithNameAndId(author.user)],
        ephemeral: true,
        status: Colors.Danger,
      });

      if (ctx.deferred) {
        return ctx.editReply(content);
      }

      return ctx.reply(content);
    }

    const textChunks = chunks(
      eventsmodeEventHistory.map(({ totalTime, totalSalary, event }, index) =>
        interpolate(`${index + 1}. Ивент: $1 | Время : $2 | Зарплата: $3`, [
          event.name,
          humanizeMinutes(totalTime),
          totalSalary.toString(),
        ]),
      ),
      20,
    );

    const embeds = textChunks.map((textArray) => {
      const embed = new EmbedBuilder();
      embed.setColor(Colors.Invisible);
      embed.setDescription(textArray.join('\n'));
      return embed;
    });

    return pagination(ctx, embeds);
  }
}
