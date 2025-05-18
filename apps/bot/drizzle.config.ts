import { defineConfig } from "drizzle-kit";

import { config } from "./src/lib/safe-env";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schemas",

  migrations: {
    prefix: "timestamp",
  },

  dbCredentials: {
    database: config.DATABASE_NAME,
    host: config.DATABASE_HOST,
    port: Number(config.DATABASE_PORT),
    password: config.DATABASE_PASS,
    user: config.DATABASE_USER,
    ssl: false,
  },

  strict: true,
  verbose: true,
});
