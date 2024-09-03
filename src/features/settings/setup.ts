import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  type MessageActionRowComponentBuilder,
} from 'discord.js';
import { Client, Discord, Guard, Slash, SlashGroup } from 'discordx';
import { type GuardPropsType, PermissionRole } from '../../guards/permission-role.guard';
import { permissionRole } from '../../schemas/eventsmodes';

@Discord()
@Guard(PermissionRole(permissionRole.developer))
@SlashGroup({ description: 'Configure bot settings for guild', name: 'settings' })
@SlashGroup('settings')
export class Command {
  @Slash({ description: 'Setup button for event start' })
  async setup(ctx: CommandInteraction<'cached'>, _: Client, props: GuardPropsType) {
    const buttonRow = [
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('start event')
          .setStyle(ButtonStyle.Secondary)
          .setCustomId('@action/start-event'),
      ),
    ];

    if (ctx.channel) {
      await ctx.channel.send({ components: buttonRow });
      await ctx.reply({ content: 'done', ephemeral: true });
      return;
    }

    await ctx.reply({ content: 'RRRR', ephemeral: true });
  }
}
