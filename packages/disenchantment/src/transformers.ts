import type {
  CommandOrCommandGroup,
  SimpleCommand,
  SubcommandGroup,
} from "./command.js";
import type { EventHandler, SimpleEvent } from "./event.js";
import { registerOption, type Options } from "./option.js";

import {
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
  SlashCommandSubcommandGroupBuilder,
} from "discord.js";

export const flattenCommandTree = (
  commands: readonly CommandOrCommandGroup[],
): Map<string, SimpleCommand<any>> => {
  const commandMap = new Map<string, SimpleCommand<any>>();

  const traverse = (
    commands: readonly CommandOrCommandGroup[],
    prefix: string[] = [],
  ) => {
    commands.forEach((cmd) => {
      const currentPath = [...prefix, cmd.name];
      const key = currentPath.join(" ");

      if (cmd.type === "command") {
        if (commandMap.get(key)) {
          throw new Error(`Duplicate command definition detected: ${key}`);
        }

        commandMap.set(key, cmd);
      } else if (cmd.type === "group") {
        cmd.commands;
        traverse(cmd.commands, currentPath);
      }
    });
  };

  traverse(commands);

  return commandMap;
};

export const serializeCommandsForAPI = (
  commands: CommandOrCommandGroup[],
): RESTPostAPIChatInputApplicationCommandsJSONBody[] => {
  const restCommandsBody: RESTPostAPIChatInputApplicationCommandsJSONBody[] =
    [];

  const serializeSimpleCommand = (
    cmd: SimpleCommand<any>,
    builder?: SlashCommandBuilder | SlashCommandSubcommandGroupBuilder,
  ) => {
    if (builder) {
      builder.addSubcommand((subCmdBuilder) => {
        subCmdBuilder.setName(cmd.name).setDescription(cmd.description);
        if (cmd.options) {
          Object.values(cmd.options).forEach((option) =>
            registerOption(subCmdBuilder, option as Options),
          );
        }
        return subCmdBuilder;
      });
    } else {
      const cmdBuilder = new SlashCommandBuilder()
        .setName(cmd.name)
        .setDescription(cmd.description);
      if (cmd.options) {
        Object.values(cmd.options).forEach((option) =>
          registerOption(cmdBuilder, option as Options),
        );
      }
      restCommandsBody.push(cmdBuilder.toJSON());
    }
  };

  const serializeCommandGroup = (
    groupCmd: SubcommandGroup,
    builder?: SlashCommandBuilder | SlashCommandSubcommandGroupBuilder,
  ) => {
    if (builder && builder instanceof SlashCommandBuilder) {
      builder.addSubcommandGroup((subGroupBuilder) => {
        subGroupBuilder
          .setName(groupCmd.name)
          .setDescription(groupCmd.description);
        traverse(groupCmd.commands, subGroupBuilder);
        return subGroupBuilder;
      });
    } else {
      const groupBuilder = new SlashCommandBuilder()
        .setName(groupCmd.name)
        .setDescription(groupCmd.description);
      traverse(groupCmd.commands, groupBuilder);
      restCommandsBody.push(groupBuilder.toJSON());
    }
  };

  const traverse = (
    cmds: (SimpleCommand<any> | SubcommandGroup)[],
    builder?: SlashCommandBuilder | SlashCommandSubcommandGroupBuilder,
  ) => {
    cmds.forEach((cmd) => {
      if (cmd.type === "command") {
        serializeSimpleCommand(cmd, builder);
      } else if (cmd.type === "group") {
        serializeCommandGroup(cmd, builder);
      }
    });
  };

  traverse(commands);
  return restCommandsBody;
};

export type EventHanlderMap = Map<
  string,
  { once: EventHandler<any>[]; on: EventHandler<any>[] }
>;

export const createEventHandlerMap = (events: SimpleEvent<any>[]) => {
  const map: EventHanlderMap = new Map();

  for (const { event, handler, once } of events) {
    const record = map.get(event);

    if (record) {
      if (once) {
        record.once.push(handler);
      } else {
        record.on.push(handler);
      }
    } else {
      map.set(event, {
        once: once ? [handler] : [],
        on: once ? [] : [handler],
      });
    }
  }

  return map;
};
