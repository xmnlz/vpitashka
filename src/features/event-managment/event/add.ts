import {
  ActionRowBuilder,
  CommandInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { db } from '../../../database/data-source';
import { Colors } from '../../../lib/constants';
import { Discord, Guard, ModalComponent, Slash, SlashGroup } from 'discordx';
import { PermissionRole } from '../../../guards/permission-role.guard';
import { embedResponse } from '../../../lib/embed-response';
import { events } from '../../../schemas/events';
import { permissionRole } from '../../../schemas/eventsmodes';

@Discord()
@Guard(PermissionRole(permissionRole.curator))
@SlashGroup({ name: 'event', description: 'events' })
export class Command {
  @SlashGroup('event')
  @Slash({ description: 'Add new event' })
  async add(ctx: CommandInteraction<'cached'>) {
    const modal = new ModalBuilder()
      .setTitle('Create event')
      .setCustomId('@modal/create-event-action');

    const rows = [
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('@modal/field-event-name')
          .setLabel('Provide event name')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(20),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('@modal/field-event-category')
          .setLabel('Provide event category name')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(20),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('@modal/field-event-multiplayer')
          .setLabel('Provide event multiplayer (exp. 0.30, 0.80)')
          .setStyle(TextInputStyle.Short),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('@modal/field-candy-per-minute')
          .setLabel('candy per minute')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('@modal/field-event-start-embed')
          .setLabel('Provide start embed text')
          .setStyle(TextInputStyle.Paragraph),
      ),
    ];

    modal.addComponents(rows);
    await ctx.showModal(modal);
  }

  @ModalComponent({ id: '@modal/create-event-action' })
  async createEventModalHandler(ctx: ModalSubmitInteraction<'cached'>) {
    const [eventName, eventCategory, eventMultiplayer, eventStartEmbed, candyPerMinute] = [
      '@modal/field-event-name',
      '@modal/field-event-category',
      '@modal/field-event-multiplayer',
      '@modal/field-event-start-embed',
      '@modal/field-candy-per-minute',
    ].map((id) => ctx.fields.getTextInputValue(id));

    await db
      .insert(events)
      .values({
        guildId: ctx.guild.id,
        name: eventName,
        category: eventCategory,
        multiplayer: parseFloat(eventMultiplayer),
        startEmbed: eventStartEmbed,
        candyPerMinute: parseFloat(candyPerMinute),
      })
      .onConflictDoNothing({ target: [events.name, events.category] });

    await ctx.reply(
      embedResponse({
        template: `Ивент был успешно добавлен!`,
        status: Colors.Success,
        ephemeral: true,
      }),
    );
  }
}
