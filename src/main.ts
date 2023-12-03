import 'reflect-metadata';
import { dirname, importx } from '@discordx/importer';
import { IntentsBitField, Partials } from 'discord.js';
import { Client, DIService, tsyringeDependencyRegistryEngine } from 'discordx';
import moment from 'moment-timezone';
import { env } from 'process';
import { container } from 'tsyringe';
import { Database } from './database/data-source.js';
import { logger } from './lib/logger.js';

import dotenv from 'dotenv';

import './lib/error-handling.js';

moment.updateLocale('en', {
  week: {
    dow: 1,
  },
});

moment.tz.setDefault('Europe/Moscow');

DIService.engine = tsyringeDependencyRegistryEngine.setInjector(container);

dotenv.config({ path: '.env.' + env.NODE_ENV });

const {
  Guilds,
  GuildMembers,
  GuildMessages,
  GuildMessageReactions,
  GuildVoiceStates,
  MessageContent,
  GuildEmojisAndStickers,
} = IntentsBitField.Flags;

const { GuildMember, Channel, Message, User } = Partials;

export const bot = new Client({
  // To use only guild command
  // botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],

  intents: [
    Guilds,
    GuildMembers,
    GuildMessages,
    GuildMessageReactions,
    GuildVoiceStates,
    MessageContent,
    GuildEmojisAndStickers,
  ],

  partials: [GuildMember, Channel, Message, User],

  // Debug logs are disabled in silent mode
  silent: true,

  simpleCommand: { prefix: '!' },
});

async function bootstrap() {
  container.resolve(Database).connect();

  await importx(`${dirname(import.meta.url)}/{events,commands}/**/*.{ts,js}`);

  if (!process.env.BOT_TOKEN) {
    return logger.error('Could not find BOT_TOKEN in your environment');
  }

  await bot.login(process.env.BOT_TOKEN);
}

bootstrap();
