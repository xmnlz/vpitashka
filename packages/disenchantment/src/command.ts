import {
  ChatInputCommandInteraction,
  type InteractionContextType,
} from "discord.js";
import { type ExtractArgs, type OptionsMap } from "./option.js";

export type SimpleCommand<T extends OptionsMap = OptionsMap> = {
  type: "command";
  name: string;
  description: string;
  options?: T;
  context: InteractionContextType[];
  handler: CommandHandler<T>;
};

export interface SubcommandGroup {
  type: "group";
  name: string;
  description: string;
  commands: (SimpleCommand | SubcommandGroup)[];
}

export type CommandOrCommandGroup = SimpleCommand | SubcommandGroup;

export type CommandHandler<T extends OptionsMap> = (
  interaction: ChatInputCommandInteraction,
  args: ExtractArgs<T>,
) => Promise<void>;

export const createCommand = <T extends OptionsMap>(
  config: Omit<SimpleCommand<T>, "type">,
): SimpleCommand<T> => ({
  type: "command",
  ...config,
});
