import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";

export async function resetDatabase(connectionString: string) {
  assertTestDatabase(connectionString);

  const db = drizzle(connectionString);

  await db.execute(sql`
    TRUNCATE TABLE
      stripe_events,
      users
    RESTART IDENTITY CASCADE
  `);
}

function assertTestDatabase(url: string) {
  const parsed = new URL(url);

  const allowedHost = process.env.E2E_DB_HOST ?? process.env.DB_HOST;

  if (parsed.hostname !== allowedHost) {
    throw new Error(`Refusing to reset database at host ${parsed.hostname}`);
  }
}
