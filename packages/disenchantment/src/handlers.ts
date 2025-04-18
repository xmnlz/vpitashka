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
import type { EventHanlderMap } from "./transformers.js";

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

export const extractCommandOptions = <
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

const buildCommandKey = (interaction: ChatInputCommandInteraction): string =>
  [
    interaction.commandName,
    interaction.options.getSubcommandGroup(false),
    interaction.options.getSubcommand(false),
  ]
    .filter(Boolean)
    .join(" ");

export const handleCommandInteraction = async (
  interaction: ChatInputCommandInteraction,
): Promise<void> => {
  const commandKey = buildCommandKey(interaction);

  const command = MetadataStorage.instance.simpleCommandMap.get(commandKey);
  if (!command) return;

  const composedGuards = composeGuards(command.guards || []);

  const context: Record<string, any> = {};

  await composedGuards(
    interaction.client,
    interaction,
    async () => {
      const options = extractCommandOptions(interaction, command.options || {});
      await command.handler(interaction, options, context);
    },
    context,
  );
};

export function bindClientEventHandlers(
  client: Client,
  eventMap: EventHanlderMap,
): void {
  for (const [eventName, { on, once }] of eventMap) {
    on.forEach((handler) =>
      client.on(eventName, (...args) => handler(client, ...args)),
    );

    once.forEach((handler) =>
      client.once(eventName, (...args) => handler(client, ...args)),
    );
  }
}
