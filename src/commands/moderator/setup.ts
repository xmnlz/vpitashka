import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonComponentData,
  ButtonInteraction,
  ButtonStyle,
  CommandInteraction,
  MessageActionRowComponentBuilder,
  ModalBuilder,
  ModalSubmitInteraction,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { ButtonComponent, Discord, Guard, ModalComponent, Slash } from 'discordx';
import { injectable } from 'tsyringe';
import { Guild } from '../../feature/guild/guild.entity.js';
import { SettingsManagementService } from '../../feature/guild/settings-management/settings-management.service.js';
import { ModeratorGuard } from '../../guards/moderator.guard.js';
import { BotMessages } from '../../lib/constants.js';

@Discord()
@injectable()
@Guard(ModeratorGuard)
export class Command {
  constructor(private readonly settingsManagementService: SettingsManagementService) {}
  @Slash({ description: 'Setup guild, roles, channels etc..' })
  async setup(ctx: CommandInteraction<'cached'>) {
    const buttonsRow = [
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('roles')
          .setStyle(ButtonStyle.Secondary)
          .setCustomId('@button/roles-configure'),
        new ButtonBuilder()
          .setLabel('channels')
          .setStyle(ButtonStyle.Secondary)
          .setCustomId('@button/channels-configure'),
        new ButtonBuilder()
          .setLabel('buttons')
          .setStyle(ButtonStyle.Secondary)
          .setCustomId('@button/event-button-create'),
        new ButtonBuilder()
          .setLabel('general')
          .setStyle(ButtonStyle.Secondary)
          .setCustomId('@button/general-configuration'),
        new ButtonBuilder()
          .setLabel('additional')
          .setStyle(ButtonStyle.Secondary)
          .setCustomId('@button/additional-configuration'),
      ),
    ];

    await ctx.reply({ content: 'setting up...', components: buttonsRow, ephemeral: true });
  }

  @ButtonComponent({ id: '@button/roles-configure' })
  async roleHandler(ctx: ButtonInteraction<'cached'>) {
    const modal = new ModalBuilder()
      .setTitle('Roles configuration')
      .setCustomId('@modal/roles-configure');

    const rows = [
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
    ];

    const guild = await Guild.findOneBy({ id: ctx.guild.id });

    if (guild && guild.settingsManagement.isRolesConfigured) {
      const { eventsmodeRoleId, coachRoleId, curatorRoleId, moderatorRoleId, adminRoleId } =
        guild.settingsManagement;

      const roleIds = [eventsmodeRoleId, coachRoleId, curatorRoleId, moderatorRoleId, adminRoleId];

      for (const [index, row] of rows.entries()) {
        row.components[0].setValue(roleIds[index]);
        row.components[0].setPlaceholder(roleIds[index]);
      }
    }

    modal.addComponents(rows);
    await ctx.showModal(modal);
  }

  @ModalComponent({ id: '@modal/roles-configure' })
  async roleModalHandler(ctx: ModalSubmitInteraction<'cached'>) {
    const [eventsmodeRoleId, coachRoleId, curatorRoleId, moderatorRoleId, adminRoleId] = [
      '@modal/field-eventsmode-id',
      '@modal/field-coach-id',
      '@modal/field-curator-id',
      '@modal/field-moderator-id',
      '@modal/field-admin-id',
    ].map((id) => ctx.fields.getTextInputValue(id));

    await this.settingsManagementService.createOrUpdateRoles(ctx.guild.id, {
      eventsmodeRoleId,
      coachRoleId,
      curatorRoleId,
      moderatorRoleId,
      adminRoleId,
    });

    await ctx.reply({ content: 'All roles are successfully configured', ephemeral: true });

    return;
  }

  @ButtonComponent({ id: '@button/channels-configure' })
  async channelHandler(ctx: ButtonInteraction<'cached'>) {
    const modal = new ModalBuilder()
      .setTitle('Channel configuration')
      .setCustomId('@modal/channel-configure');

    const guild = await Guild.findOneBy({ id: ctx.guild.id });

    const {
      isStartedEventCategory,
      eventsmodeCategoryId,
      startedEventCategoryId,
      announceEventChannelId,
    } = guild!.settingsManagement;

    const baseRows = [
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('@modal/field-event-category-id')
          .setLabel('Event Category Id')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder(eventsmodeCategoryId ? eventsmodeCategoryId : '999999999999999999')
          .setValue(eventsmodeCategoryId ? eventsmodeCategoryId : '999999999999999999')
          .setMinLength(18)
          .setMaxLength(20),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('@modal/field-event-started-category-id')
          .setLabel('Event Started Category Id')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder(startedEventCategoryId || '999999999999999999')
          .setRequired(false)
          .setMinLength(18)
          .setMaxLength(20),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('@modal/field-event-announce-channel-id')
          .setLabel('Event Announce Channel Id')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder(announceEventChannelId || '999999999999999999')
          .setRequired(false)
          .setMinLength(18)
          .setMaxLength(20),
      ),
    ];

    if (startedEventCategoryId && startedEventCategoryId.length) {
      baseRows[1].components[0].setValue(startedEventCategoryId);
    }

    if (announceEventChannelId && announceEventChannelId.length) {
      baseRows[2].components[0].setValue(announceEventChannelId);
    }

    modal.addComponents(baseRows);
    await ctx.showModal(modal);
  }

  @ModalComponent({ id: '@modal/channel-configure' })
  async channelConfigurationModalHandler(ctx: ModalSubmitInteraction<'cached'>) {
    const guild = await Guild.findOneBy({ id: ctx.guild.id });

    let [eventsmodeCategoryId, startedEventCategoryId, announceEventChannelId] = [
      '@modal/field-event-category-id',
      '@modal/field-event-started-category-id',
      '@modal/field-event-announce-channel-id',
    ].map((id) => ctx.fields.getTextInputValue(id));

    await this.settingsManagementService.createOrUpdateChannels(ctx.guild.id, {
      startedEventCategoryId,
      eventsmodeCategoryId,
      announceEventChannelId,
    });

    await ctx.reply({ content: 'Channels are successfully configured', ephemeral: true });
    return;
  }

  @ButtonComponent({ id: '@button/event-button-create' })
  async buttonHandler(ctx: ButtonInteraction<'cached'>) {
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

    await ctx.reply({ content: BotMessages.SOMETHING_GONE_WRONG, ephemeral: true });
  }

  @ButtonComponent({ id: '@button/general-configuration' })
  async generalConfigurationHandler(ctx: ButtonInteraction<'cached'>) {
    const guild = await Guild.findOneBy({ id: ctx.guild.id });

    const modal = new ModalBuilder()
      .setTitle('Channel configuration')
      .setCustomId('@modal/general-configure');

    const { minimumWeeklyQuota } = guild!.settingsManagement;

    const rows = [
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('@modal/field-minimum-weekly-quota')
          .setLabel('Provide minimum weekly quota in HOURS')
          .setPlaceholder(String(minimumWeeklyQuota))
          .setValue(String(minimumWeeklyQuota))
          .setStyle(TextInputStyle.Short)
          .setMaxLength(3),
      ),
    ];

    modal.addComponents(rows);
    await ctx.showModal(modal);
  }

  @ModalComponent({ id: '@modal/general-configure' })
  async generalConfigurationModalHandler(ctx: ModalSubmitInteraction<'cached'>) {
    const [minimumWeeklyQuota] = ['@modal/field-minimum-weekly-quota'].map((id) =>
      ctx.fields.getTextInputValue(id),
    );

    await this.settingsManagementService.updateMinimumWeeklyQuota(
      ctx.guild.id,
      parseInt(minimumWeeklyQuota),
    );

    await ctx.reply({ content: 'all set', ephemeral: true });
    return;
  }

  @ButtonComponent({ id: '@button/additional-configuration' })
  async additionalConfigurationHandler(ctx: ButtonInteraction<'cached'>) {
    const guild = await Guild.findOneBy({ id: ctx.guild.id });

    const { isStartedEventCategory, isEventAnnounce } = guild!.settingsManagement;

    const buttonRow = [
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel(`ActiveEventCategory is ${isStartedEventCategory ? '[ON]' : '[OFF]'}`)
          .setStyle(isStartedEventCategory ? ButtonStyle.Success : ButtonStyle.Danger)
          .setCustomId('@button/active-event-category'),
        new ButtonBuilder()
          .setLabel(`EventAnnounce is ${isEventAnnounce ? '[ON]' : '[OFF]'}`)
          .setStyle(isEventAnnounce ? ButtonStyle.Success : ButtonStyle.Danger)
          .setCustomId('@button/event-announce'),
      ),
    ];

    await ctx.reply({ components: buttonRow, ephemeral: true });
    return;
  }

  @ButtonComponent({ id: '@button/active-event-category' })
  async activeEventCategoryHandler(ctx: ButtonInteraction<'cached'>) {
    await ctx.deferUpdate({ fetchReply: true });

    const guild = await Guild.findOneBy({ id: ctx.guild.id });

    const { isStartedEventCategory } = guild!.settingsManagement;

    await this.settingsManagementService.toggleStartedEventCategory(
      ctx.guild.id,
      !isStartedEventCategory,
    );

    const buttons = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      ctx.message.components[0].components.map((rawComponent) => {
        const button = new ButtonBuilder(rawComponent.toJSON() as ButtonComponentData);

        if (rawComponent.customId === ctx.component.customId) {
          button.setLabel(`ActiveEventCategory is ${!isStartedEventCategory ? '[ON]' : '[OFF]'}`);
          button.setStyle(!isStartedEventCategory ? ButtonStyle.Success : ButtonStyle.Danger);
        }

        return button;
      }),
    );

    await ctx.editReply({ components: [buttons] });
    return;
  }

  @ButtonComponent({ id: '@button/event-announce' })
  async eventAnnounceHandler(ctx: ButtonInteraction<'cached'>) {
    await ctx.deferUpdate({ fetchReply: true });

    const guild = await Guild.findOneBy({ id: ctx.guild.id });

    const { isEventAnnounce } = guild!.settingsManagement;

    await this.settingsManagementService.toggleEventAnnounce(ctx.guild.id, !isEventAnnounce);

    const buttons = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      ctx.message.components[0].components.map((rawComponent) => {
        const button = new ButtonBuilder(rawComponent.toJSON() as ButtonComponentData);

        if (rawComponent.customId === ctx.component.customId) {
          button.setLabel(`EventAnnounce is ${!isEventAnnounce ? '[ON]' : '[OFF]'}`);
          button.setStyle(!isEventAnnounce ? ButtonStyle.Success : ButtonStyle.Danger);
        }

        return button;
      }),
    );

    await ctx.editReply({ components: [buttons] });
    return;
  }
}
