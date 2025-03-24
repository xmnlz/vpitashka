import { env } from "process";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),

  BOT_TOKEN: z.string(),

  DATABASE_HOST: z.string(),
  DATABASE_PORT: z.string(),
  DATABASE_NAME: z.string(),
  DATABASE_USER: z.string(),
  DATABASE_PASS: z.string(),
});

export const safeEnv = () => {
  const { success } = envSchema.safeParse(env);

  if (!success) {
    throw new Error("NO SUCCESS U SUCK");
  }
};

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }

  interface BunEnv extends z.infer<typeof envSchema> {}
}
