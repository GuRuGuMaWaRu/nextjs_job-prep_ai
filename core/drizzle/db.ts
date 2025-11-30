import { drizzle } from "drizzle-orm/node-postgres";

import { env } from "@/core/data/env/server";
import * as schema from "@/core/drizzle/schema";

export const db = drizzle(env.DATABASE_URL, {
  logger: true,
  schema,
});
