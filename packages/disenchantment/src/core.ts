import { Client, type ClientOptions, type Interaction } from "discord.js";
import { type CommandOrCommandGroup } from "./command.js";
import { flattenCommands, registerCommands } from "./command-register.js";
import { executeInteraction } from "./interactiom-handler.js";
import { MetadataStorage } from "./metadata-storage.js";

export interface BotOptions {
  commands: CommandOrCommandGroup[];
  clientOptions: ClientOptions;
  guildIds?: string[];
}

/**
 * Creates and boots up the Discord bot.
 *
 * @param options - Bot configuration, including commands and client options.
 * @returns An initialized Discord Client.
 */
export async function createBot({
  clientOptions,
  commands,
}: BotOptions): Promise<Client> {
  const client = new Client(clientOptions);

  const commandMap = flattenCommands(commands);
  const slashCommands = registerCommands(commands);

  MetadataStorage.instance.setSimpleCommandMap(commandMap);
  MetadataStorage.instance.setCommandJsonBodies(slashCommands);

  return client;
}
