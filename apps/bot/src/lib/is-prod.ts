import { env } from "process";

export const isProd = env.NODE_ENV === "production";
