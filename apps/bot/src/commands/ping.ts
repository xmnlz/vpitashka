import {
  ApplicationCommandOptionType,
  InteractionContextType,
} from "discord.js";
import { createCommand, group, option } from "disenchantment";

export const banCommand = createCommand({
  name: "ban",
  description: "Ban a user",
  context: [InteractionContextType.Guild],
  handler: async (interaction, args) => {
    // args.target is correctly inferred as `string` (User ID)
    await interaction.reply(`🔨 Banned user <@${interaction.toString()}>`);
  },
});

export const testCommand = createCommand({
  name: "adwadadaw",
  description: "Ban a user",
  context: [InteractionContextType.Guild],
  options: {
    user: option({
      name: "adad",
      description: "User to ban",
      type: ApplicationCommandOptionType.User,
      required: true,
    }),
  },
  handler: async (interaction, args) => {
    console.log(args);

    args.user;
    await interaction.reply(`${JSON.stringify(args)}`);
  },
});

export const tomatoCommand = createCommand({
  name: "tomato",
  description: "tomato desc",
  context: [InteractionContextType.Guild],
  handler: async (interaction, args) => {
    await interaction.reply(`${JSON.stringify(args)}`);
  },
});

export const adminGroup = group("admin", "desc", [banCommand, testCommand]);
export const someNewGroup = group("subgroup", "subsub", [adminGroup]);
