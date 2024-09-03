import { ApplicationCommandOptionType, CommandInteraction, GuildMember } from 'discord.js';
import { Client, Discord, Guard, Slash, SlashGroup, SlashOption } from 'discordx';
import { sql } from 'drizzle-orm';
import { db } from '../../database/data-source';
import { PermissionRole, type GuardPropsType } from '../../guards/permission-role.guard';
import { permissionRole, eventsmodes } from '../../schemas/eventsmodes';

@Discord()
@Guard(PermissionRole(permissionRole.curator))
@SlashGroup({ name: 'eventsmode', description: 'eventsmode' })
export class Command {
  @SlashGroup('eventsmode')
  @Slash({ description: 'Hire eventsmode' })
  async hire(
    @SlashOption({
      description: 'member',
      name: 'member',
      required: false,
      type: ApplicationCommandOptionType.User,
    })
    member: GuildMember,
    ctx: CommandInteraction<'cached'>,
    _: Client,
    props: GuardPropsType,
  ) {
    await ctx.deferReply();

    const eventsmode = await db
      .insert(eventsmodes)
      .values({ userId: member.user.id, guildId: ctx.guild.id })
      .onConflictDoUpdate({
        target: [eventsmodes.userId, eventsmodes.guildId],
        set: { isHired: sql`NOT ${eventsmodes.isHired}` },
      })
      .returning();

    await ctx.editReply(JSON.stringify(eventsmode, null, 4));
  }
}
