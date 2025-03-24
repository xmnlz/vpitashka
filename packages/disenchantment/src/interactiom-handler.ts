import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  Client,
} from "discord.js";
import { type ExtractArgs, type OptionsMap } from "./option.js";
import { MetadataStorage } from "./metadata-storage.js";

const getCommandKey = (interaction: ChatInputCommandInteraction): string =>
  [
    interaction.commandName,
    interaction.options.getSubcommandGroup(false),
    interaction.options.getSubcommand(false),
  ]
    .filter(Boolean)
    .join(" ");

export const parseOptions = <T extends OptionsMap>(
  interaction: ChatInputCommandInteraction,
  options: T,
): ExtractArgs<T> => {
  const args = {} as ExtractArgs<T>;

  for (const key in options) {
    const opt = options[key];
    if (!opt) return;

    switch (opt.type) {
      case ApplicationCommandOptionType.String:
        args[key] = interaction.options.getString(
          opt.name,
          opt.required,
        ) as any;
        break;
      case ApplicationCommandOptionType.Integer:
        args[key] = interaction.options.getInteger(
          opt.name,
          opt.required,
        ) as any;
        break;
      case ApplicationCommandOptionType.Number:
        args[key] = interaction.options.getNumber(
          opt.name,
          opt.required,
        ) as any;
        break;
      case ApplicationCommandOptionType.Boolean:
        args[key] = interaction.options.getBoolean(
          opt.name,
          opt.required,
        ) as any;
        break;
      case ApplicationCommandOptionType.User:
        args[key] = interaction.options.getUser(opt.name, opt.required) as any;
        break;
      case ApplicationCommandOptionType.Channel:
        args[key] = interaction.options.getChannel(
          opt.name,
          opt.required,
        ) as any;
        break;
      case ApplicationCommandOptionType.Role:
        args[key] = interaction.options.getRole(opt.name, opt.required) as any;
        break;
      case ApplicationCommandOptionType.Mentionable:
        args[key] = interaction.options.getMentionable(
          opt.name,
          opt.required,
        ) as any;
        break;
      case ApplicationCommandOptionType.Attachment:
        args[key] = interaction.options.getAttachment(
          opt.name,
          opt.required,
        ) as any;
        break;
    }
  }
  return args;
};

export const executeInteraction = async (
  interaction: ChatInputCommandInteraction,
): Promise<void> => {
  const commandKey = getCommandKey(interaction);

  const command = MetadataStorage.instance.simpleCommandMap.get(commandKey);
  if (!command) return;

  if (command.options) {
    const args = parseOptions(interaction, command.options);
    await command.handler(interaction, args);
  } else {
    await command.handler(interaction, {});
  }
};

export const initApplicationCommands = async (
  client: Client,
  guildIds?: string[],
) => {
  const restCommands = MetadataStorage.instance.commandJsonBodies;

  if (guildIds && guildIds.length >= 1) {
    for (let guildId of guildIds) {
      const guild = client.guilds.cache.get(guildId);

      if (guild) {
        await guild.commands.set(restCommands);
        return;
      }

      console.log(`Guild with id of ${guildId} can not be fetched from cache`);
    }
  } else {
    await client.application?.commands.set(restCommands);
  }
};
