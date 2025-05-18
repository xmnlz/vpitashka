import pg from "pg";

import { drizzle } from "drizzle-orm/node-postgres";
import { config } from "../lib/safe-env";
import { isProd } from "../lib/is-prod";

import * as guild from "../schemas/guild";
import * as guildLogger from "../schemas/guild-logger";
import * as eventmode from "../schemas/eventmode";
import * as event from "../schemas/event";
import * as user from "../schemas/user";
import * as warn from "../schemas/warn";
import * as eventBan from "../schemas/event-ban";
import * as eventHistory from "../schemas/event-history";
import * as eventActivitie from "../schemas/event-activitie";

export const pool = new pg.Pool({
  database: config.DATABASE_NAME,
  host: config.DATABASE_HOST,
  port: Number(config.DATABASE_PORT),
  user: config.DATABASE_USER,
  password: config.DATABASE_PASS,
});

export const db = drizzle(pool, {
  logger: !isProd,
  schema: {
    ...guild,
    ...guildLogger,
    ...eventmode,
    ...user,
    ...event,
    ...eventBan,
    ...warn,
    ...eventHistory,
    ...eventActivitie,
  },
});
