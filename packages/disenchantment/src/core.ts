import { Client, type ClientOptions } from "discord.js";
import { type CommandOrCommandGroup } from "./command.js";
import { flattenCommands, registerCommands } from "./command-register.js";
import { MetadataStorage } from "./metadata-storage.js";

export interface BotOptions {
  commands: CommandOrCommandGroup[];
  clientOptions: ClientOptions;
}

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
