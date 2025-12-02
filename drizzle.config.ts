import { defineConfig } from "drizzle-kit";
import { env } from "./core/data/env/server";

export default defineConfig({
  out: "./core/drizzle/migrations",
  schema: "./core/drizzle/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL!,
  },
});
