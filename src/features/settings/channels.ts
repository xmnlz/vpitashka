import {
  ActionRowBuilder,
  CommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
} from 'discord.js';
import { Client, Discord, Guard, ModalComponent, Slash, SlashGroup } from 'discordx';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../database/data-source';
import { type GuardPropsType, PermissionRole } from '../../guards/permission-role.guard';
import { i18n } from '../../lib/i18n';
import { permissionRole } from '../../schemas/eventsmodes';
import { guilds } from '../../schemas/guilds';

@Discord()
@Guard(PermissionRole(permissionRole.administrator))
@SlashGroup({ description: 'Configure bot settings for guild', name: 'settings' })
@SlashGroup('settings')
export class Command {
  @Slash({ description: 'Configure channels config' })
  async channels(ctx: CommandInteraction<'cached'>, _: Client, props: GuardPropsType) {
    const {
      eventsmode: { preferredLanguage },
    } = props;

    const t = i18n(preferredLanguage);

    const channelsSettingsModal = new ModalBuilder()
      .setTitle(t('settings.roles.modal.title'))
      .setCustomId('@modal/settings-channels');

    channelsSettingsModal.addComponents([
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('@modal/field-event-category-id')
          .setLabel('Event Category Id')
          .setStyle(TextInputStyle.Short)
          .setMinLength(18)
          .setMaxLength(20),
      ),
    ]);

    channelsSettingsModal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('@modal/field-event-started-category-id')
          .setLabel('Event Started Category Id')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMinLength(18)
          .setMaxLength(20),
      ),
    );

    channelsSettingsModal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('@modal/field-event-announce-channel-id')
          .setLabel('Event Announce Channel Id')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMinLength(18)
          .setMaxLength(20),
      ),
    );

    await ctx.showModal(channelsSettingsModal);
  }

  @ModalComponent({ id: '@modal/settings-channels' })
  async modalLoggerHandler(
    ctx: ModalSubmitInteraction<'cached'>,
    _: Client,
    props: GuardPropsType,
  ) {
    const {
      guild: { protoSettings },
    } = props;

    const channels = {
      eventCategoryId:
        ctx.fields.getTextInputValue('@modal/field-event-category-id') ||
        protoSettings.channels.eventCategoryId,
      startedEventCategoryId:
        ctx.fields.getTextInputValue('@modal/field-event-started-category-id') ||
        protoSettings.channels.startedEventCategoryId,
      announceEventChannelId:
        ctx.fields.getTextInputValue('@modal/field-event-announce-channel-id') ||
        protoSettings.channels.announceEventChannelId,
    };

    await db
      .update(guilds)
      .set({
        protoSettings: sql`${guilds.protoSettings} || jsonb_build_object('channels', ${JSON.stringify(channels)}::jsonb)`,
      })
      .where(eq(guilds.id, ctx.guild.id));

    await ctx.reply('done.');
  }
}
