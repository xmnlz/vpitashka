import type {
  CommandOrCommandGroup,
  SimpleCommand,
  SubcommandGroup,
} from "./command.js";
import { registerOption, type Options } from "./option.js";

import {
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
  SlashCommandSubcommandGroupBuilder,
} from "discord.js";

export const flattenCommands = (
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

/**
 * Registers commands as Discord JSON bodies.
 *
 * This function recursively registers both simple commands and command groups.
 *
 * @param commands - Array of commands or command groups.
 * @returns Array of JSON bodies for Discord slash commands.
 */
export const registerCommands = (
  commands: CommandOrCommandGroup[],
): RESTPostAPIChatInputApplicationCommandsJSONBody[] => {
  const restCommandsBody: RESTPostAPIChatInputApplicationCommandsJSONBody[] =
    [];

  /**
   * Registers a simple command on the provided builder.
   *
   * @param cmd - The simple command to register.
   * @param builder - Optional builder to which the command is added as a subcommand.
   */
  const registerSimpleCommand = (
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

  /**
   * Registers a command group on the provided builder.
   *
   * @param groupCmd - The command group to register.
   * @param builder - Optional builder to which the group is added.
   */
  const registerCommandGroup = (
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

  /**
   * Recursively traverses and registers commands with an optional builder.
   *
   * @param cmds - Array of simple commands or command groups.
   * @param builder - Optional builder for nesting commands.
   */
  const traverse = (
    cmds: (SimpleCommand<any> | SubcommandGroup)[],
    builder?: SlashCommandBuilder | SlashCommandSubcommandGroupBuilder,
  ) => {
    cmds.forEach((cmd) => {
      if (cmd.type === "command") {
        registerSimpleCommand(cmd, builder);
      } else if (cmd.type === "group") {
        registerCommandGroup(cmd, builder);
      }
    });
  };

  traverse(commands);
  return restCommandsBody;
};
