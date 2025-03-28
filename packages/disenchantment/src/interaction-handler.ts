import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  Client,
} from "discord.js";
import {
  type ExtractArgs,
  type OptionInterface,
  type OptionsMap,
  type OptionValue,
} from "./option.js";
import { MetadataStorage } from "./metadata-storage.js";

const getCommandKey = (interaction: ChatInputCommandInteraction): string =>
  [
    interaction.commandName,
    interaction.options.getSubcommandGroup(false),
    interaction.options.getSubcommand(false),
  ]
    .filter(Boolean)
    .join(" ");

export const parseOptions = <
  T extends OptionsMap<Record<string, OptionInterface>>,
>(
  interaction: ChatInputCommandInteraction,
  options: T,
): ExtractArgs<T> => {
  const args: Record<string, any> = {};

  for (const [key, opt] of Object.entries(options)) {
    const { name, required } = opt;

    switch (opt.type) {
      case ApplicationCommandOptionType.String:
        args[key] = interaction.options.getString(
          name,
          required,
        ) as OptionValue<(typeof opt)["type"]>;
        break;
      case ApplicationCommandOptionType.Integer:
        args[key] = interaction.options.getInteger(
          name,
          required,
        ) as OptionValue<T[typeof key]["type"]>;
        break;
      case ApplicationCommandOptionType.Number:
        args[key] = interaction.options.getNumber(
          name,
          required,
        ) as OptionValue<T[typeof key]["type"]>;
        break;
      case ApplicationCommandOptionType.Boolean:
        args[key] = interaction.options.getBoolean(
          name,
          required,
        ) as OptionValue<T[typeof key]["type"]>;
        break;
      case ApplicationCommandOptionType.User:
        args[key] = interaction.options.getUser(name, required) as OptionValue<
          T[typeof key]["type"]
        >;
        break;
      case ApplicationCommandOptionType.Channel:
        args[key] = interaction.options.getChannel(
          name,
          required,
        ) as OptionValue<T[typeof key]["type"]>;
        break;
      case ApplicationCommandOptionType.Role:
        args[key] = interaction.options.getRole(name, required) as OptionValue<
          T[typeof key]["type"]
        >;
        break;
      case ApplicationCommandOptionType.Mentionable:
        args[key] = interaction.options.getMentionable(
          name,
          required,
        ) as OptionValue<T[typeof key]["type"]>;
        break;
      case ApplicationCommandOptionType.Attachment:
        args[key] = interaction.options.getAttachment(
          name,
          required,
        ) as OptionValue<T[typeof key]["type"]>;
        break;
      default:
        throw new Error(`Unsupported option type: ${opt}`);
    }
  }

  return args as ExtractArgs<T>;
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
