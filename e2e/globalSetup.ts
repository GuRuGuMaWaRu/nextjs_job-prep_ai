import { env } from "@core/data/env/server";

import { resetDatabase } from "./resetDatabase";

export default async function globalSetup() {
  await resetDatabase(env.DATABASE_URL);
}
