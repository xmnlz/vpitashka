import { CommandInteraction, EmbedBuilder } from 'discord.js';
import { asc, eq } from 'drizzle-orm';
import { db } from '../../../database/data-source';
import { BotMessages, Colors } from '../../../lib/constants';
import { Discord, Guard, Slash, SlashGroup } from 'discordx';
import { PermissionRole } from '../../../guards/permission-role.guard';
import { embedResponse } from '../../../lib/embed-response';
import { chunks, pagination } from '../../../lib/pagination';
import { permissionRole } from '../../../schemas/eventsmodes';
import { events } from '../../../schemas/events';

@Discord()
@Guard(PermissionRole(permissionRole.curator))
@SlashGroup({ name: 'event', description: 'events' })
export class Command {
  @SlashGroup('event')
  @Slash({ description: 'List of all events' })
  async list(ctx: CommandInteraction<'cached'>) {
    await ctx.deferReply({ ephemeral: true });

    const eventList = await db.query.events.findMany({
      where: eq(events.guildId, ctx.guild.id),
      orderBy: [asc(events.candyPerMinute)],
    });

    if (!eventList.length) {
      return await ctx.editReply(
        embedResponse({
          template: BotMessages.EVENT_LIST_EMPTY,
          status: Colors.Danger,
          ephemeral: true,
        }),
      );
    }

    const textChunks = chunks(
      eventList.map(
        ({ name, category, multiplayer }, index) =>
          `${index + 1}. ${name} | ${category} | ${multiplayer}`,
      ),
      25,
    );

    const embeds = textChunks.map((textArray) => {
      const embed = new EmbedBuilder();
      embed.setColor(Colors.Info);
      embed.setDescription(textArray.join('\n'));
      return embed;
    });

    return pagination(ctx, embeds);
  }
}
