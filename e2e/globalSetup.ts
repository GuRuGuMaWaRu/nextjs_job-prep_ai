import { env } from "@core/data/env/server";

import { ensureDatabaseSchema } from "./ensureDatabaseSchema";
import { resetDatabase } from "./resetDatabase";

export default async function globalSetup() {
  ensureDatabaseSchema();
  await resetDatabase(env.DATABASE_URL);
}
