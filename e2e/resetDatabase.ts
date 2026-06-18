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
  const dbName = new URL(url).hostname;

  if (!dbName.includes("square-cloud")) {
    throw new Error(`Refusing to reset non-test database ${dbName}`);
  }
}
