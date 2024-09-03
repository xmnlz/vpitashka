import 'reflect-metadata';

import { dirname, importx } from '@discordx/importer';
import { IntentsBitField, Partials } from 'discord.js';
import { runDrizzleMigration } from './database/migrate';
import { __prod__ } from './lib/is-prod';
import { logger } from './lib/logger';
import { Client } from 'discordx';

runDrizzleMigration();

const {
  Guilds,
  GuildMembers,
  GuildMessages,
  GuildMessageReactions,
  GuildVoiceStates,
  MessageContent,
  GuildEmojisAndStickers,
} = IntentsBitField.Flags;

export const bot = new Client({
  // Debug only
  botGuilds: ['1040400907545874434'],

  intents: [
    Guilds,
    GuildMembers,
    GuildMessages,
    GuildMessageReactions,
    GuildVoiceStates,
    MessageContent,
    GuildEmojisAndStickers,
  ],
  partials: [Partials.GuildMember, Partials.Channel, Partials.Message, Partials.User],
  silent: __prod__,
});

async function bootstrap() {
  await importx(`${dirname(import.meta.url)}/{events,features}/**/*.{ts,js}`);

  if (!process.env.BOT_TOKEN) {
    return logger.error('Could not find BOT_TOKEN in your environment');
  }

  await bot.login(process.env.BOT_TOKEN);
}

void bootstrap();
