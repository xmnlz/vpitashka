import {
  ActionRowBuilder,
  CommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { Client, Discord, Guard, Slash } from 'discordx';
import { type GuardPropsType, PermissionRole } from '../../guards/permission-role.guard';
import { i18n } from '../../lib/i18n';
import { permissionRole } from '../../schemas/eventsmodes'

@Discord()
@Guard(PermissionRole(permissionRole.administrator))
export class Command {
  @Slash({ description: 'Configure logger behavior' })
  async logger(ctx: CommandInteraction<'cached'>, _: Client, props: GuardPropsType) {
    const {
      eventsmode: { preferredLanguage },
    } = props;

    const t = i18n(preferredLanguage);

    const loggerModal = new ModalBuilder()
      .setTitle(t('logger.modal.title'))
      .setCustomId('@modal/logger');

    loggerModal.addComponents([
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('@modal-field/channel-id')
          .setLabel(t('logger.modal.channelFieldDescription'))
          .setStyle(TextInputStyle.Short),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('@modal-field/guild-id')
          .setLabel(t('logger.modal.guildFieldDescription'))
          .setStyle(TextInputStyle.Short)
          .setRequired(false),
      ),
    ]);

    await ctx.showModal(loggerModal);
  }
}
