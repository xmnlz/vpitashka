import type { SimpleCommand, SubcommandGroup } from "./command.js";

export const group = (
  name: string,
  description: string,
  commands: (SubcommandGroup | SimpleCommand<any>)[],
): SubcommandGroup => ({
  type: "group",
  name,
  description,
  commands,
});
