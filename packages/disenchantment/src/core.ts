import { Client, type ClientOptions } from "discord.js";
import type { CommandOrCommandGroup } from "./command.js";
import {
  createEventHandlerMap,
  flattenCommandTree,
  serializeCommandsForAPI,
} from "./transformers.js";
import { MetadataStorage } from "./metadata-storage.js";
import type { SimpleEvent } from "./event.js";
import { bindClientEventHandlers } from "./handlers.js";

export interface BotOptions {
  commands: CommandOrCommandGroup[];
  events: SimpleEvent<any>[];
  clientOptions: ClientOptions;
}

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

export async function createBot({
  clientOptions,
  commands,
  events,
}: BotOptions): Promise<Client> {
  const client = new Client(clientOptions);

  const commandMap = flattenCommandTree(commands);
  const slashCommands = serializeCommandsForAPI(commands);
  const eventMap = createEventHandlerMap(events);

  bindClientEventHandlers(client, eventMap);

  MetadataStorage.instance.setSimpleCommandMap(commandMap);
  MetadataStorage.instance.setCommandJsonBodies(slashCommands);

  return client;
}
