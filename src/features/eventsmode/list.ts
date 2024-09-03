import { bold, CommandInteraction, EmbedBuilder, userMention } from 'discord.js';
import { Client, Discord, Guard, Slash, SlashGroup } from 'discordx';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '../../database/data-source';
import { PermissionRole, type GuardPropsType } from '../../guards/permission-role.guard';
import { Colors } from '../../lib/constants';
import { permissionToString, interpolate } from '../../lib/string-utils';
import { chunks, pagination } from '../../lib/pagination';
import { permissionRole, eventsmodes } from '../../schemas/eventsmodes';

@Discord()
@Guard(PermissionRole(permissionRole.eventsmode))
@SlashGroup({ name: 'eventsmode', description: 'eventsmode' })
export class Command {
  @SlashGroup('eventsmode')
  @Slash({ description: 'Connection to the selected voice channel' })
  async list(ctx: CommandInteraction<'cached'>, _: Client, props: GuardPropsType) {
    await ctx.deferReply();

    // const t = i18n(preferredLanguage);

    const eventsmodeList = await db.query.eventsmodes.findMany({
      where: and(eq(eventsmodes.isHired, true), eq(eventsmodes.guildId, ctx.guild.id)),
      orderBy: [asc(eventsmodes.permissionRole)],
    });

    const textChunks = chunks(
      eventsmodeList.map(({ userId, permissionRole }, index) =>
        interpolate(`${index + 1}. $1 | $2`, [
          userMention(userId),
          bold(permissionToString(permissionRole)),
        ]),
      ),
      10,
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
