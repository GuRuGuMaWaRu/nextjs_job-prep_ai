import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DB_PASSWORD: z.string().min(1),
    DB_HOST: z.string().min(1),
    DB_PORT: z.string().min(1),
    DB_USER: z.string().min(1),
    DB_NAME: z.string().min(1),
    DB_SSLMODE: z.string().min(1).optional(),
    ARCJET_KEY: z.string().min(1),
    HUME_API_KEY: z.string().min(1),
    HUME_SECRET_KEY: z.string().min(1),
    GEMINI_API_KEY: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
    STRIPE_PRO_PRICE_ID: z.string().min(1).optional(),
    STRIPE_PRO_PRODUCT_ID: z.string().min(1).optional(),
    APP_URL: z.string().url().optional(),
    CRON_SECRET: z.string().min(15).max(15),
  },
  createFinalSchema: (env) => {
    return z.object(env).transform((val) => {
      const {
        DB_PASSWORD,
        DB_HOST,
        DB_PORT,
        DB_USER,
        DB_NAME,
        DB_SSLMODE,
        ...rest
      } = val;
      const sslModeSuffix = DB_SSLMODE
        ? `?sslmode=${encodeURIComponent(DB_SSLMODE)}`
        : "";
      return {
        ...rest,
        DATABASE_URL: `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}${sslModeSuffix}`,
      };
    });
  },
  emptyStringAsUndefined: true,
  experimental__runtimeEnv: process.env,
});
