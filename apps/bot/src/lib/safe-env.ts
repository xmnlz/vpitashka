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

const parsed = envSchema.safeParse(env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  for (const issue of parsed.error.issues) {
    console.error(`- ${issue.path.join(".")}: ${issue.message}`);
  }
  throw new Error("Failed to parse environment variables");
}

export const config = parsed.data;
