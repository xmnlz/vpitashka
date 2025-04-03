import type { Client } from "discord.js";

export type NextFn = () => Promise<void>;

export type GuardFn<T = any, C extends Record<string, any> = {}> = (
  client: Client,
  interaction: T,
  next: NextFn,
  context: C,
) => any;

export const composeGuards = <T, C extends Record<string, any> = {}>(
  guards: GuardFn<T>[],
) => {
  return async (client: Client, interaction: T, next: NextFn, context: C) => {
    let index = -1;

    const dispatch = async (i: number) => {
      if (index >= i) throw new Error("next() called multiple times");

      index = i;

      if (i < guards.length) {
        const guard = guards[i];

        if (guard) {
          await guard(client, interaction, () => dispatch(i + 1), context);
        }
      } else {
        await next();
      }
    };

    await dispatch(0);
  };
};
