import type { Config } from 'drizzle-kit';
import { env } from 'process';
import { safeEnvLoad } from './src/lib/safe-env';

env.NODE_ENV = 'development';

safeEnvLoad();

export default {
  schema: './src/schemas/*.ts',
  out: './drizzle',
  dialect: 'postgresql',
  strict: true,
  verbose: true,
  dbCredentials: {
    user: env.DATABASE_USER,
    port: Number(env.DATABASE_PORT),
    password: env.DATABASE_PASS,
    host: env.DATABASE_HOST,
    database: env.DATABASE_NAME,
    ssl: false,
  },
} satisfies Config;
