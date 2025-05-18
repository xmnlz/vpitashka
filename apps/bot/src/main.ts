import { createBot } from "disenchantment";
import { IntentsBitField } from "discord.js";
import { config } from "./lib/safe-env";

import { eventmodeGroup } from "./commands/eventsmode";

import { onceReadyEvent, readyEvent } from "./events/ready";
import { interactionCreateEvent } from "./events/interaction-create";
import { guildMemberRemoveEvent } from "./events/guild-member-remove";

const { Guilds, GuildMembers, GuildMessages, MessageContent } =
  IntentsBitField.Flags;

export const bot = await createBot({
  commands: [eventmodeGroup],
  events: [
    onceReadyEvent,
    readyEvent,
    interactionCreateEvent,
    guildMemberRemoveEvent,
  ],
  clientOptions: {
    intents: [Guilds, GuildMembers, GuildMessages, MessageContent],
  },
});

async function bootstrap() {
  await bot.login(config.BOT_TOKEN);
}

bootstrap();
