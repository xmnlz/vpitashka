import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CommandInteraction,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
  ComponentType,
} from 'discord.js';

export const chunks = <T>(array: T[], size = 10): T[][] => {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size),
  );
};

export const pagination = async (
  ctx: CommandInteraction<'cached'> | ButtonInteraction<'cached'>,
  embeds: EmbedBuilder[],
) => {
  if (!embeds.length) throw new Error('Embeds array is empty, pls provide some embeds.');

  let currentPage = 0;
  const maxLength = embeds.length;
  const maxExistingLength = embeds.length - 1;

  const buttons = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setEmoji('⏪')
      .setStyle(ButtonStyle.Secondary)
      .setCustomId('embed-start-button'),
    new ButtonBuilder()
      .setEmoji('⬅')
      .setStyle(ButtonStyle.Secondary)
      .setCustomId('embed-back-button'),
    new ButtonBuilder()
      .setEmoji('➡')
      .setStyle(ButtonStyle.Secondary)
      .setCustomId('embed-forward-button'),
    new ButtonBuilder()
      .setEmoji('⏩')
      .setStyle(ButtonStyle.Secondary)
      .setCustomId('embed-end-button'),
  );

  const message = await ctx.editReply({
    embeds: [
      (embeds.at(currentPage) as EmbedBuilder).setFooter({
        text: `${currentPage + 1}/${maxLength}`,
      }),
    ],
    components: maxLength === 1 ? undefined : [buttons],
  });

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 60_000 * 7,
  });

  collector.on('collect', async (i: ButtonInteraction<'cached'>) => {
    if (i.customId === 'embed-forward-button') {
      if (currentPage < maxExistingLength) {
        ++currentPage;
        await i.update({
          embeds: [
            (embeds.at(currentPage) as EmbedBuilder).setFooter({
              text: `${currentPage + 1}/${maxLength}`,
            }),
          ],
        });
        return;
      }
    }

    if (i.customId === 'embed-back-button') {
      if (currentPage > 0) {
        --currentPage;
        await i.update({
          embeds: [
            (embeds.at(currentPage) as EmbedBuilder).setFooter({
              text: `${currentPage + 1}/${maxLength}`,
            }),
          ],
        });
        return;
      }
    }

    if (i.customId === 'embed-start-button') {
      if (currentPage > 0) {
        currentPage = 0;
        await i.update({
          embeds: [
            (embeds.at(currentPage) as EmbedBuilder).setFooter({
              text: `${currentPage + 1}/${maxLength}`,
            }),
          ],
        });
        return;
      }
    }

    if (i.customId === 'embed-end-button') {
      if (currentPage < maxExistingLength) {
        currentPage = maxExistingLength;

        await i.update({
          embeds: [
            (embeds.at(currentPage) as EmbedBuilder).setFooter({
              text: `${currentPage + 1}/${maxLength}`,
            }),
          ],
        });
        return;
      }
    }

    await i.update({});
  });

  collector.on('end', async () => {
    if (maxLength === 1) return;

    buttons.components.map((component) => component.setDisabled());

    await ctx.editReply({ components: [buttons] });
  });
};
