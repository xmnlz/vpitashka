import type {
  CommandOrCommandGroup,
  SimpleCommand,
  SubcommandGroup,
} from "./command.js";
import { registerOption, type OptionsMap } from "./option.js";

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
 * Converts our command definitions into the JSON format required by Discord’s REST API.
 */
export const registerCommands = (
  commands: readonly CommandOrCommandGroup[],
): RESTPostAPIChatInputApplicationCommandsJSONBody[] => {
  const restCommandsBody: RESTPostAPIChatInputApplicationCommandsJSONBody[] =
    [];

  const traverse = (
    cmds: readonly (SimpleCommand<OptionsMap> | SubcommandGroup)[],
    builder?: SlashCommandBuilder | SlashCommandSubcommandGroupBuilder,
  ) => {
    cmds.forEach((cmd) => {
      if (cmd.type === "command") {
        if (builder) {
          builder.addSubcommand((subCmdBuilder) => {
            subCmdBuilder.setName(cmd.name).setDescription(cmd.description);

            if (cmd.options) {
              Object.values(cmd.options).forEach((option) =>
                registerOption(subCmdBuilder, option),
              );
            }

            return subCmdBuilder;
          });
        } else {
          const cmdBuilder = new SlashCommandBuilder()
            .setName(cmd.name)
            .setDescription(cmd.description)
            .setContexts(cmd.context);

          if (cmd.options) {
            Object.values(cmd.options).forEach((option) =>
              registerOption(cmdBuilder, option),
            );
          }

          restCommandsBody.push(cmdBuilder.toJSON());
        }
      } else if (cmd.type === "group") {
        if (builder && builder instanceof SlashCommandBuilder) {
          builder.addSubcommandGroup((subGroupBuilder) => {
            subGroupBuilder.setName(cmd.name).setDescription(cmd.description);
            traverse(cmd.commands, subGroupBuilder);
            return subGroupBuilder;
          });
        } else {
          const builder = new SlashCommandBuilder()
            .setName(cmd.name)
            .setDescription(cmd.description);

          traverse(cmd.commands, builder);

          restCommandsBody.push(builder.toJSON());
        }
      }
    });
  };

  traverse(commands);

  console.log(JSON.stringify(restCommandsBody, null, 4));

  return restCommandsBody;
};
