import { ChatInputCommandInteraction } from "discord.js";
import { type ExtractArgs, type OptionsMap } from "./option.js";
import type { GuardFn } from "./guard.js";

export type SimpleCommand<
  T extends OptionsMap = OptionsMap,
  C extends Record<string, any> = any,
> = {
  type: "command";
  name: string;
  description: string;
  options?: T;
  guards?: GuardFn<any, C>[];
  handler: CommandHandler<T, C>;
};

export interface SubcommandGroup {
  type: "group";
  name: string;
  description: string;
  commands: (SimpleCommand | SubcommandGroup)[];
}

export type CommandOrCommandGroup = SimpleCommand<any> | SubcommandGroup;

export type CommandHandler<
  T extends OptionsMap,
  C extends Record<string, any> = {},
> = (
  interaction: ChatInputCommandInteraction,
  args: ExtractArgs<T>,
  context: C,
) => Promise<void>;

export const createCommand = <
  T extends OptionsMap,
  C extends Record<string, any> = {},
>(
  config: Omit<SimpleCommand<T, C>, "type">,
): SimpleCommand<T, C> => ({
  type: "command",
  ...config,
});
