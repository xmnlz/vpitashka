import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  bold,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CommandInteraction,
  ComponentType,
  EmbedBuilder,
  GuildMember,
  inlineCode,
  type MessageActionRowComponentBuilder,
  ModalBuilder,
  type RestOrArray,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { Client, Discord, Guard, Slash, SlashGroup, SlashOption } from 'discordx';
import { and, eq } from 'drizzle-orm';
import { db } from '../../database/data-source';
import { type GuardPropsType, PermissionRole } from '../../guards/permission-role.guard';
import { BASE_COLLECTOR_TIME, Colors, FALLBACK_AVATAR } from '../../lib/constants';
import { embedResponse } from '../../lib/embed-response';
import { i18n, type SupportedLanguages } from '../../lib/i18n';
import { isEmptyObject, objectDiff } from '../../lib/object-utils';
import { safeReply } from '../../lib/safe-reply';
import { permissionToString, userWithNameAndId } from '../../lib/string-utils';
import { humanizeSeconds, parseTimeString, totalTimeInSeconds } from '../../lib/time-utils';
import { XMap } from '../../lib/x-map';
import { eventsmodes, permissionRole, type SelectEventsmode } from '../../schemas/eventsmodes';
import { log } from '../logger/utils/guild-logger'

interface ButtonHandlers {
  [key: string]: ButtonHandlerParams;
}

type ButtonHandlerParams = (
  member: GuildMember,
  buttonInteraction: ButtonInteraction<'cached'>,
  props: GuardPropsType,
  kvStore: XMap<string, EventsmodePartialType>,
) => Promise<void>;

type EventsmodePartialType = Pick<
  SelectEventsmode,
  'hearts' | 'weeklyTime' | 'weeklySalary' | 'permissionRole'
>;

@Discord()
@Guard(PermissionRole(permissionRole.curator))
@SlashGroup({ name: 'eventsmode', description: 'eventsmode' })
export class Command {
  buttonHandlers: ButtonHandlers = {
    '@button/set-weekly-time': this.handleSetWeeklyTimeButton.bind(this),
    '@button/set-hearts': this.handleSetHeartsButton.bind(this),
    '@button/set-position': this.handleSetPositionButton.bind(this),
    '@button/apply-changes': this.handleApplyButton.bind(this),
    '@button/refresh': this.handleRefreshButton.bind(this),
  };

  @SlashGroup('eventsmode')
  @Slash({ description: 'Edit eventsmode' })
  async edit(
    @SlashOption({
      description: 'member',
      name: 'member',
      required: false,
      type: ApplicationCommandOptionType.User,
    })
    member: GuildMember | undefined,
    ctx: CommandInteraction<'cached'>,
    _: Client,
    props: GuardPropsType,
  ) {
    await ctx.deferReply({ ephemeral: true });

    const discordMember = member || ctx.member;

    const { eventsmode } = props;

    const eventsmodeMember = await db.query.eventsmodes.findFirst({
      where: and(
        eq(eventsmodes.guildId, ctx.guild.id),
        eq(eventsmodes.isHired, true),
        eq(eventsmodes.userId, discordMember.user.id),
      ),
    });

    if (!eventsmodeMember) {
      return await safeReply(
        ctx,
        embedResponse({ ephemeral: true, template: 'NEIN!', status: Colors.Invisible }),
      );
    }

    const infoEmbed = this.getUpdatedEmbed(
      discordMember,
      eventsmodeMember.permissionRole,
      eventsmodeMember.hearts,
      eventsmodeMember.weeklyTime,
      props.eventsmode.preferredLanguage,
    );

    const buttons = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new ButtonBuilder()
        .setEmoji({ id: '1222269430864805888' })
        .setCustomId('@button/set-weekly-time')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setEmoji({ id: '1222269345091158100' })
        .setCustomId('@button/set-hearts')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setEmoji({ id: '1222269230498447534' })
        .setCustomId('@button/set-position')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setEmoji({ id: '1222269250396487930' })
        .setCustomId('@button/apply-changes')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setEmoji({ id: '1222269300463894620' })
        .setCustomId('@button/refresh')
        .setStyle(ButtonStyle.Secondary),
    );

    const mess = await ctx.editReply({ embeds: [infoEmbed], components: [buttons] });

    const buttonCollector = mess.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: BASE_COLLECTOR_TIME,
    });

    const kvStore = new XMap<string, EventsmodePartialType>();

    kvStore.set(eventsmode.id, {
      permissionRole: eventsmodeMember.permissionRole,
      hearts: eventsmodeMember.hearts,
      weeklyTime: eventsmodeMember.weeklyTime,
      weeklySalary: eventsmodeMember.weeklySalary,
    });

    buttonCollector.on('collect', async (buttonInteraction) => {
      const buttonId = buttonInteraction.customId;

      const handler = this.buttonHandlers[buttonId];

      if (handler) {
        await handler(discordMember, buttonInteraction, props, kvStore);
      } else {
        console.log('missing button handler for ', buttonId);
      }
    });

    buttonCollector.on('end', async () => {
      buttons.components.map((component) => component.setDisabled());

      await ctx.editReply({ components: [buttons] });
    });
  }

  getUpdatedEmbed(
    member: GuildMember,
    permissionRole: number,
    hearts: number,
    time: number,
    language: SupportedLanguages,
  ) {
    const t = i18n(language);

    return new EmbedBuilder()
      .setColor(Colors.Info)
      .setAuthor({
        name: userWithNameAndId(member.user, false),
      })
      .setThumbnail(
        member.displayAvatarURL({ size: 1024, forceStatic: true, extension: 'webp' }) ||
          FALLBACK_AVATAR,
      )
      .addFields([
        {
          name: t('units.weeklyTime').toLowerCase(),
          value: humanizeSeconds(time),
          inline: true,
        },
        {
          name: t('units.hearts').toLowerCase(),
          value: hearts.toString(),
          inline: true,
        },
        {
          name: t('units.permissionRole').toLowerCase(),
          value: permissionToString(permissionRole),
          inline: true,
        },
      ]);
  }

  async handleSetWeeklyTimeButton(
    member: GuildMember,
    buttonInteraction: ButtonInteraction<'cached'>,
    props: GuardPropsType,
    kvStore: XMap<string, EventsmodePartialType>,
  ) {
    const data = kvStore.get(props.eventsmode.id);
    if (!data) return;

    const modal = new ModalBuilder()
      .setCustomId('@modal/set-weekly-time')
      .setTitle('modal tranlsation need');

    const rows = [
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId(`@modal-field/set-weekly-time`)
          .setLabel('weekly time ex. (+1h 2m, -2m 20s, 1h 9m 9s)')
          .setValue(humanizeSeconds(data.weeklyTime))
          .setStyle(TextInputStyle.Short),
      ),
    ];

    modal.addComponents(rows);

    await buttonInteraction.showModal(modal);

    const submitted = await buttonInteraction
      .awaitModalSubmit({
        time: BASE_COLLECTOR_TIME,
        dispose: true,
      })
      .catch();

    if (!submitted) return;

    await submitted.deferUpdate({});

    const time = submitted.fields.getTextInputValue('@modal-field/set-weekly-time');

    const parsedTime = parseTimeString(time);

    if (!parsedTime) {
      await submitted.followUp({ content: 'parsing failed', ephemeral: true });
      return;
    }

    const timeInSeconds = totalTimeInSeconds({
      seconds: parsedTime.seconds,
      minutes: parsedTime.minutes,
      hours: parsedTime.hours,
    });

    let currentTime: number = data.weeklyTime;

    if (parsedTime.sign === '+') {
      currentTime += timeInSeconds;
    }

    if (parsedTime.sign === '-') {
      currentTime -= timeInSeconds;
      if (currentTime <= 0) currentTime = 0;
    }

    if (parsedTime.sign === null) {
      currentTime = timeInSeconds;
    }

    kvStore.append(props.eventsmode.id, { weeklyTime: currentTime });

    const embed = this.getUpdatedEmbed(
      member,
      data.permissionRole,
      data.hearts,
      currentTime,
      props.eventsmode.preferredLanguage,
    );

    await buttonInteraction.editReply({ embeds: [embed] });
  }

  async handleSetHeartsButton(
    member: GuildMember,
    buttonInteraction: ButtonInteraction<'cached'>,
    props: GuardPropsType,
    kvStore: XMap<string, EventsmodePartialType>,
  ) {
    const data = kvStore.get(props.eventsmode.id);
    if (!data) return;

    const modal = new ModalBuilder()
      .setCustomId('@modal/set-hearts')
      .setTitle('modal tranlsation need');

    const rows = [
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId(`@modal-field/set-hearts`)
          .setLabel('Edit hearts amount ex. (+300, -200, 100)')
          .setValue(data.hearts.toString())
          .setStyle(TextInputStyle.Short),
      ),
    ];

    modal.addComponents(rows);

    await buttonInteraction.showModal(modal);

    const submitted = await buttonInteraction
      .awaitModalSubmit({
        time: BASE_COLLECTOR_TIME,
        dispose: true,
      })
      .catch();

    if (!submitted) return;

    await submitted.deferUpdate({});

    const hearts = submitted.fields.getTextInputValue('@modal-field/set-hearts');

    const parsedHearts = hearts.match(/^([-+])?(\d+)$/);

    if (!parsedHearts) {
      await submitted.followUp({ content: 'parsing failed', ephemeral: true });
      return;
    }

    const sign: string | null = parsedHearts[1] || null;
    const heartsAmount: number = parseInt(parsedHearts[2]);

    let totalHearts: number = data.hearts;

    if (sign === '+') {
      totalHearts += heartsAmount;
    }

    if (sign === '-') {
      totalHearts -= heartsAmount;
      if (totalHearts < 0) totalHearts = 0;
    }

    if (sign === null) {
      totalHearts = heartsAmount;
    }

    const updatedDate = kvStore.append(props.eventsmode.id, { hearts: totalHearts });

    if (!updatedDate) return;

    const embed = this.getUpdatedEmbed(
      member,
      updatedDate.permissionRole,
      updatedDate.hearts,
      updatedDate.weeklyTime,
      props.eventsmode.preferredLanguage,
    );

    await buttonInteraction.editReply({ embeds: [embed] });
  }

  async handleSetPositionButton(
    member: GuildMember,
    buttonInteraction: ButtonInteraction<'cached'>,
    props: GuardPropsType,
    kvStorage: XMap<string, EventsmodePartialType>,
  ) {
    const originalMess = buttonInteraction.message.components;

    await buttonInteraction.deferUpdate();

    const permissionList = [
      {
        label: permissionToString(permissionRole.eventsmode),
        value: permissionRole.eventsmode.toString(),
      },
      { label: permissionToString(permissionRole.coach), value: permissionRole.coach.toString() },
      {
        label: permissionToString(permissionRole.curator),
        value: permissionRole.curator.toString(),
      },
      {
        label: permissionToString(permissionRole.moderator),
        value: permissionRole.moderator.toString(),
      },
      {
        label: permissionToString(permissionRole.administrator),
        value: permissionRole.administrator.toString(),
      },
      {
        label: permissionToString(permissionRole.developer),
        value: permissionRole.developer.toString(),
      },
    ].filter((obj) => props.eventsmode.permissionRole >= Number(obj.value));

    const mess = await buttonInteraction.editReply({
      components: [
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .addOptions(permissionList)
            .setCustomId('@select-menu/permission-list'),
        ),
      ],
    });

    const selectorInteraction = await mess
      .awaitMessageComponent({
        componentType: ComponentType.StringSelect,
        time: BASE_COLLECTOR_TIME,
        dispose: true,
      })
      .catch();

    await selectorInteraction.deferUpdate();

    const selectedValue = Number(selectorInteraction.values[0]);

    const updatedDate = kvStorage.append(props.eventsmode.id, { permissionRole: selectedValue });
    if (!updatedDate) return;

    const embed = this.getUpdatedEmbed(
      member,
      updatedDate.permissionRole,
      updatedDate.hearts,
      updatedDate.weeklyTime,
      props.eventsmode.preferredLanguage,
    );

    await buttonInteraction.editReply({ embeds: [embed], components: originalMess });
  }

  async handleApplyButton(
    member: GuildMember,
    buttonInteraction: ButtonInteraction<'cached'>,
    props: GuardPropsType,
    kvStore: XMap<string, EventsmodePartialType>,
  ) {
    await buttonInteraction.deferReply({ ephemeral: true });

    const userT = i18n(props.eventsmode.preferredLanguage);
    const guildT = i18n(props.guild.preferredLanguage);

    const eventsmode = await db.query.eventsmodes.findFirst({
      where: and(
        eq(eventsmodes.userId, member.user.id),
        eq(eventsmodes.guildId, member.guild.id),
        eq(eventsmodes.isHired, true),
      ),
      columns: { permissionRole: true, hearts: true, weeklyTime: true },
    });
    if (!eventsmode) return;

    const data = kvStore.get(props.eventsmode.id);
    if (!data) return;

    const [user] = await db
      .update(eventsmodes)
      .set({ ...data })
      .where(
        and(
          eq(eventsmodes.userId, member.user.id),
          eq(eventsmodes.guildId, member.guild.id),
          eq(eventsmodes.isHired, true),
        ),
      )
      .returning({
        permissionRole: eventsmodes.permissionRole,
        hearts: eventsmodes.hearts,
        weeklyTime: eventsmodes.weeklyTime,
      });

    const diff = objectDiff(eventsmode, user);

    if (isEmptyObject(diff)) {
      await buttonInteraction.editReply(
        'nothing to save, you need to make changes first then save',
      );
      return;
    }

    const fieldsToUser: RestOrArray<{ name: string; value: string; inline?: boolean }> = [];
    const fieldsToLogger: RestOrArray<{ name: string; value: string; inline?: boolean }> = [];

    if (diff.weeklyTime) {
      const value = bold(
        `${inlineCode(humanizeSeconds(eventsmode.weeklyTime))} -> ${inlineCode(humanizeSeconds(diff.weeklyTime))}`,
      );

      fieldsToUser.push({ name: userT('units.weeklyTime'), value, inline: true });
      fieldsToLogger.push({ name: guildT('units.weeklyTime'), value, inline: true });
    }

    if (diff.hearts) {
      const value = bold(
        `${inlineCode(eventsmode.hearts.toString())} -> ${inlineCode(diff.hearts.toString())}`,
      );
      fieldsToUser.push({ name: userT('units.hearts'), value, inline: true });
      fieldsToLogger.push({ name: guildT('units.hearts'), value, inline: true });
    }

    if (diff.permissionRole) {
      const value = bold(
        `${inlineCode(permissionToString(eventsmode.permissionRole))} -> ${inlineCode(permissionToString(diff.permissionRole))}`,
      );
      fieldsToUser.push({ name: userT('units.permissionRole'), value, inline: true });
      fieldsToLogger.push({ name: guildT('units.permissionRole'), value, inline: true });
    }

    const embed = new EmbedBuilder()
      .setColor(Colors.Success)
      .setDescription(
        userT('eventsmode.edit.buttons.save.success', {
          author: userWithNameAndId(buttonInteraction.user),
          target: userWithNameAndId(member.user),
        }),
      )
      .addFields(fieldsToUser)
      .setTimestamp();

    await buttonInteraction.editReply({ embeds: [embed] });

    await log(buttonInteraction.guildId, {
      bot: buttonInteraction.client,
      message: { embeds: [embed.setFields(fieldsToLogger).setColor(Colors.Info)] },
    });
  }

  async handleRefreshButton(
    member: GuildMember,
    buttonInteraction: ButtonInteraction<'cached'>,
    props: GuardPropsType,
    kvStore: XMap<string, EventsmodePartialType>,
  ) {
    await buttonInteraction.deferUpdate();

    const eventsmode = await db.query.eventsmodes.findFirst({
      where: and(
        eq(eventsmodes.userId, member.user.id),
        eq(eventsmodes.guildId, member.guild.id),
        eq(eventsmodes.isHired, true),
      ),
    });

    if (!eventsmode) return;

    kvStore.set(props.eventsmode.id, {
      permissionRole: eventsmode.permissionRole,
      hearts: eventsmode.hearts,
      weeklyTime: eventsmode.weeklyTime,
      weeklySalary: eventsmode.weeklySalary,
    });

    const data = kvStore.get(props.eventsmode.id);

    if (!data) return;

    const embed = this.getUpdatedEmbed(
      member,
      data.permissionRole,
      data.hearts,
      data.weeklyTime,
      props.eventsmode.preferredLanguage,
    );

    await buttonInteraction.editReply({ embeds: [embed] });
  }
}
