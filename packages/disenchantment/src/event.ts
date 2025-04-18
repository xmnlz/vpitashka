import type { Client, ClientEvents } from "discord.js";

export type EventHandler<N extends keyof ClientEvents> = (
  client: Client,
  ...args: ClientEvents[N]
) => Promise<void>;

export interface SimpleEvent<N extends keyof ClientEvents> {
  once?: boolean;
  event: N;
  handler: EventHandler<N>;
}

export const createEvent = <N extends keyof ClientEvents>(
  config: SimpleEvent<N>,
) => {
  return config;
};
