import { env } from "process";
import { z } from "zod";

const envSchema = z.object({
  BOT_TOKEN: z.string(),

  DEV_GUILD_ID: z.string(),

  DATABASE_HOST: z.string(),
  DATABASE_PORT: z.string(),
  DATABASE_NAME: z.string(),
  DATABASE_USER: z.string(),
  DATABASE_PASS: z.string(),
});

export const safeEnv = () => {
  const { success, error } = envSchema.safeParse(env);

  if (!success) {
    console.error("Invalid environment variables:");

    error.format();

    for (const issue of error.issues) {
      console.error(`- ${issue.path.join(".")}: ${issue.message}`);
    }

    throw new Error("Failed to parse environment variables");
  }
};

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }

  interface Env extends z.infer<typeof envSchema> {}
}
