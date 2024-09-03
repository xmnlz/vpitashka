import { env } from 'process';
import { z } from 'zod';

import * as dotenv from 'dotenv';

const envVariables = z.object({
  NODE_ENV: z.enum(['development', 'production']),

  BOT_TOKEN: z.string(),

  OWNER_ID: z.string(),

  DATABASE_HOST: z.string(),
  DATABASE_PORT: z.string(),
  DATABASE_NAME: z.string(),
  DATABASE_USER: z.string(),
  DATABASE_PASS: z.string(),
});
export const safeEnvLoad = () => {
  dotenv.config({ path: '.env.' + env.NODE_ENV, debug: true });
  envVariables.parse(env);
};

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envVariables> {}
  }
}
