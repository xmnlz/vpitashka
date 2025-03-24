import {
  createBot,
  executeInteraction,
  initApplicationCommands,
} from "disenchantment";
import { Client, IntentsBitField, type Interaction } from "discord.js";
import { safeEnv } from "./lib/safe-env";
import { adminGroup, someNewGroup, testCommand } from "./commands/ping";
import { env } from "bun";

safeEnv();

const { Guilds, GuildMembers, GuildMessages } = IntentsBitField.Flags;

const bot = await createBot({
  commands: [testCommand],
  clientOptions: {
    intents: [Guilds, GuildMembers, GuildMessages],
  },
});

async function bootstrap() {
  await bot.login(env.BOT_TOKEN);
  bot.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;
    await executeInteraction(interaction);
  });

  bot.on("ready", async (client: Client) => {
    await client.guilds.fetch();

    initApplicationCommands(client, [env.DEV_GUILD_ID]);

    console.log("LGTM!!!");
  });
}

bootstrap();
