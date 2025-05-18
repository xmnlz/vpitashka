import { createEvent, handleCommandInteraction } from "disenchantment";

export const interactionCreateEvent = createEvent({
  event: "interactionCreate",
  handler: async (_client, interaction) => {
    if (!interaction.isChatInputCommand()) return;
    await handleCommandInteraction(interaction);
  },
});
