import { ApplicationCommandOptionType, CommandInteraction } from 'discord.js';
import { Discord, Guard, Slash, SlashChoice, SlashGroup, SlashOption } from 'discordx';
import { PermissionRole } from '../../../guards/permission-role.guard';
import { permissionRole } from '../../../schemas/eventsmodes';

@Discord()
@Guard(PermissionRole(permissionRole.curator))
@SlashGroup({ name: 'event', description: 'events' })
export class Command {
  @SlashGroup('event')
  @Slash({ description: 'Edit event certain field' })
  async edit(
    @SlashOption({
      description: 'event name',
      name: 'name',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    name: string,
    @SlashOption({
      description: 'event category',
      name: 'category',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    category: string,
    @SlashChoice('name', 'category', 'multiplayer', 'startEmbed', 'announcedEmbed')
    @SlashOption({
      description: 'Choice field tha you wanna change',
      name: 'field',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    field: string,
    @SlashOption({
      description: 'Value that will be replaced',
      name: 'value',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    value: string,

    ctx: CommandInteraction<'cached'>,
  ) {
    // const event = await db.query.events.findFirst({ where: and(eq(events)) });
    //
    // if (!event) {
    //   return await ctx.editReply(
    //     embedResponse({
    //       template: 'event not ex',
    //       ephemeral: true,
    //     }),
    //   );
    // }

    // await this.eventService.updateEvent(
    //   ctx.guild.id,
    //   event.id,
    //   field,
    //   Number.isNaN(parseFloat(value)) ? value : parseFloat(value),
    // );

    const template: string = `$1 изменил поле $2 на $3 ивента $4`;

    // await this.loggerService.log({
    //   guildId: ctx.guild.id,
    //   bot: ctx.client,
    //   message: embedResponse({
    //     template: template,
    //     replaceArgs: [userWithNameAndId(ctx.user), bold(field), bold(value), `${name}|${category}`],
    //   }),
    // });

    // await ctx.reply(
    //   embedResponse({
    //     template: `Вы изменил поле $1 на $2 ивента $3`,
    //     replaceArgs: [bold(field), bold(value), `${name}|${category}`],
    //     status: Colors.SUCCESS,
    //     ephemeral: true,
    //   }),
    // );
  }
}
