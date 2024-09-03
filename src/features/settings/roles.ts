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
  @Slash({ description: 'Configure logger behavior' })
  async roles(ctx: CommandInteraction<'cached'>, _: Client, props: GuardPropsType) {
    const {
      eventsmode: { preferredLanguage },
    } = props;

    const t = i18n(preferredLanguage);

    const rolesSettingsModal = new ModalBuilder()
      .setTitle(t('settings.roles.modal.title'))
      .setCustomId('@modal/settings-roles');

    rolesSettingsModal.addComponents([
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('@modal/field-admin-id')
          .setLabel('Admin Role Id')
          .setStyle(TextInputStyle.Short)
          .setMinLength(18)
          .setMaxLength(20),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('@modal/field-moderator-id')
          .setLabel('Moderator Role Id')
          .setStyle(TextInputStyle.Short)
          .setMinLength(18)
          .setMaxLength(20),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('@modal/field-curator-id')
          .setLabel('Curator Role Id')
          .setStyle(TextInputStyle.Short)
          .setMinLength(18)
          .setMaxLength(20),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('@modal/field-coach-id')
          .setLabel('Coach Role Id')
          .setStyle(TextInputStyle.Short)
          .setMinLength(18)
          .setMaxLength(20),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('@modal/field-eventsmode-id')
          .setLabel('Eventsmode Role Id')
          .setStyle(TextInputStyle.Short)
          .setMinLength(18)
          .setMaxLength(20),
      ),
    ]);

    await ctx.showModal(rolesSettingsModal);
  }

  @ModalComponent({ id: '@modal/settings-roles' })
  async modalLoggerHandler(ctx: ModalSubmitInteraction<'cached'>) {
    const [eventsmodeRoleId, coachRoleId, curatorRoleId, moderatorRoleId, adminRoleId] = [
      '@modal/field-eventsmode-id',
      '@modal/field-coach-id',
      '@modal/field-curator-id',
      '@modal/field-moderator-id',
      '@modal/field-admin-id',
    ].map((id) => ctx.fields.getTextInputValue(id));

    await db
      .update(guilds)
      .set({
        protoSettings: sql`jsonb_set(${guilds.protoSettings}, '{roles}', jsonb_build_object(
          'adminRoleId', ${adminRoleId}::text,
          'moderatorRoleId', ${moderatorRoleId}::text,
          'curatorRoleId', ${curatorRoleId}::text,
          'coachRoleId', ${coachRoleId}::text,
          'eventsmodeRoleId', ${eventsmodeRoleId}::text),
          true)`,
      })
      .where(eq(guilds.id, ctx.guild.id));

    await ctx.reply('done.');
  }
}
