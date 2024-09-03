import pg from 'pg';

import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from 'process';
import { __prod__ } from '../lib/is-prod';
import { safeEnvLoad } from '../lib/safe-env';

import * as user from '../schemas/users';
import * as guild from '../schemas/guilds';
import * as event from '../schemas/events';
import * as eventsmode from '../schemas/eventsmodes';
import * as eventBans from '../schemas/event-bans';
import * as eventActivities from '../schemas/event-activities';
import * as eventHistory from '../schemas/event-history';
import * as globalEventBan from '../schemas/global-event-ban';
import * as warns from '../schemas/warns';
import * as guildLogger from '../schemas/guild-logger';

safeEnvLoad();

export const pool = new pg.Pool({
  host: env.DATABASE_HOST,
  user: env.DATABASE_USER,
  password: env.DATABASE_PASS,
  database: env.DATABASE_NAME,
  port: Number(env.DATABASE_PORT),
});

export const db = drizzle(pool, {
  logger: !__prod__,
  schema: {
    ...user,
    ...guild,
    ...event,
    ...eventsmode,
    ...eventBans,
    ...eventActivities,
    ...eventHistory,
    ...globalEventBan,
    ...warns,
    ...guildLogger,
  },
});
