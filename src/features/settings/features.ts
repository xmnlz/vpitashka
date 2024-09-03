import {
  ActionRowBuilder,
  CommandInteraction,
  ComponentType,
  type MessageActionRowComponentBuilder,
  StringSelectMenuBuilder,
  type StringSelectMenuInteraction,
} from 'discord.js';
import { Client, Discord, Guard, Slash, SlashGroup } from 'discordx';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../database/data-source';
import { type GuardPropsType, PermissionRole } from '../../guards/permission-role.guard';
import { BASE_COLLECTOR_TIME } from '../../lib/constants';
import { i18n } from '../../lib/i18n';
import { permissionRole } from '../../schemas/eventsmodes';
import { guilds } from '../../schemas/guilds';

@Discord()
@Guard(PermissionRole(permissionRole.administrator))
@SlashGroup({ description: 'Configure bot settings for guild', name: 'settings' })
@SlashGroup('settings')
export class Command {
  @Slash({ description: 'Configure channels config' })
  async features(ctx: CommandInteraction<'cached'>, _: Client, props: GuardPropsType) {
    await ctx.deferReply({ ephemeral: true });

    const {
      eventsmode: { preferredLanguage },
      guild: { protoSettings },
    } = props;

    const t = i18n(preferredLanguage);

    const options = Object.entries(protoSettings.features).map(([key, value], index) => {
      return { label: key, default: value, value: key };
    });

    const selectMenu = new StringSelectMenuBuilder()
      .addOptions(options)
      .setCustomId('@select-menu/feature-list')
      .setMinValues(0)
      .setMaxValues(options.length);

    const selectMenuRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      selectMenu,
    );

    const mess = await ctx.editReply({ components: [selectMenuRow] });

    const selectMenuCollector = mess.createMessageComponentCollector({
      time: BASE_COLLECTOR_TIME,
      componentType: ComponentType.StringSelect,
    });

    selectMenuCollector.on(
      'collect',
      async (interaction: StringSelectMenuInteraction<'cached'>) => {
        const guild = await db.query.guilds.findFirst({
          where: eq(guilds.id, ctx.guild.id),
        });

        const { protoSettings } = guild!;

        const updatedFeatures = { ...protoSettings.features };

        for (const feature of Object.keys(updatedFeatures)) {
          updatedFeatures[feature as keyof typeof protoSettings.features] =
            interaction.values.includes(feature);
        }

        await db.update(guilds).set({
          protoSettings: sql`${guilds.protoSettings} || jsonb_build_object('features', ${JSON.stringify(updatedFeatures)}::jsonb)`,
        });

        selectMenu.setOptions(
          Object.entries(updatedFeatures).map(([key, value]) => ({
            label: key,
            default: value,
            value: key,
          })),
        );

        const selectMenuRow =
          new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(selectMenu);

        await interaction.update({
          components: [selectMenuRow],
        });
      },
    );

    selectMenuCollector.on('end', async (interaction) => {
      selectMenu.setDisabled(true);

      const selectMenuRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        selectMenu,
      );

      await ctx.editReply({ components: [selectMenuRow] });
    });
  }
}
