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
import { composeGuards } from "./guard.js";

const optionExtractors: Record<
  ApplicationCommandOptionType,
  (
    interaction: ChatInputCommandInteraction,
    name: string,
    required: boolean,
  ) => unknown
> = {
  [ApplicationCommandOptionType.Subcommand]: () => null, // Placeholder
  [ApplicationCommandOptionType.SubcommandGroup]: () => null, // Placeholder
  [ApplicationCommandOptionType.String]: (interaction, name, required) =>
    interaction.options.getString(name, required),
  [ApplicationCommandOptionType.Integer]: (interaction, name, required) =>
    interaction.options.getInteger(name, required),
  [ApplicationCommandOptionType.Number]: (interaction, name, required) =>
    interaction.options.getNumber(name, required),
  [ApplicationCommandOptionType.Boolean]: (interaction, name, required) =>
    interaction.options.getBoolean(name, required),
  [ApplicationCommandOptionType.User]: (interaction, name, required) =>
    interaction.options.getUser(name, required),
  [ApplicationCommandOptionType.Channel]: (interaction, name, required) =>
    interaction.options.getChannel(name, required),
  [ApplicationCommandOptionType.Role]: (interaction, name, required) =>
    interaction.options.getRole(name, required),
  [ApplicationCommandOptionType.Mentionable]: (interaction, name, required) =>
    interaction.options.getMentionable(name, required),
  [ApplicationCommandOptionType.Attachment]: (interaction, name, required) =>
    interaction.options.getAttachment(name, required),
};

export const parseOptions = <
  T extends OptionsMap<Record<string, OptionInterface>>,
>(
  interaction: ChatInputCommandInteraction,
  options: T,
): ExtractArgs<T> => {
  const args: Record<string, unknown> = {};

  for (const [key, opt] of Object.entries(options)) {
    const extractor = optionExtractors[opt.type];
    if (!extractor) {
      throw new Error(`Unsupported option type: ${opt.type}`);
    }
    args[key] = extractor(interaction, opt.name, opt.required) as OptionValue<
      T[typeof key]["type"]
    >;
  }

  return args as ExtractArgs<T>;
};

const getCommandKey = (interaction: ChatInputCommandInteraction): string =>
  [
    interaction.commandName,
    interaction.options.getSubcommandGroup(false),
    interaction.options.getSubcommand(false),
  ]
    .filter(Boolean)
    .join(" ");

export const executeInteraction = async (
  interaction: ChatInputCommandInteraction,
): Promise<void> => {
  const commandKey = getCommandKey(interaction);

  const command = MetadataStorage.instance.simpleCommandMap.get(commandKey);
  if (!command) return;

  const composedGuards = composeGuards(command.guards || []);

  const context: Record<string, any> = {};

  await composedGuards(
    interaction.client,
    interaction,
    async () => {
      const options = parseOptions(interaction, command.options || {});
      await command.handler(interaction, options, context);
    },
    context,
  );
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
