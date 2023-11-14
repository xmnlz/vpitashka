import {
  CommandInteraction,
  InteractionReplyOptions,
  MessageComponentInteraction,
  ModalSubmitInteraction,
} from 'discord.js';

export const replyOrFollowUp = async (
  interaction: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction,
  replyOptions: (InteractionReplyOptions & { ephemeral?: boolean }) | string,
) => {
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(replyOptions);
    return;
  }

  await interaction.reply(replyOptions);
};
