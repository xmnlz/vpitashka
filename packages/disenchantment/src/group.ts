import type {
  SimpleCommand,
  SubcommandGroup,
  TopLevelCommandGroup,
} from "./command.js";

export const group = (
  name: string,
  description: string,
  commands: (SubcommandGroup | SimpleCommand<any>)[],
): SubcommandGroup | TopLevelCommandGroup => ({
  type: "group",
  name,
  description,
  commands,
});
