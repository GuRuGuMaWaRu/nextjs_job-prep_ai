import { drizzle } from "drizzle-orm/node-postgres";
import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { and, or, eq, inArray, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";

const statusEnum = pgEnum("status", [
  "creating",
  "open",
  "payment_pending",
  "completed",
  "failed",
  "expired",
]);

const testTable = pgTable(
  "checkout_attempts",
  {
    id: uuid().primaryKey().defaultRandom(),
    status: statusEnum().default("creating"),
    idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    priceId: varchar("price_id", { length: 255 }).notNull(),
    stripeSessionId: varchar("stripe_session_id", { length: 255 }),
  },
  (table) => [
    uniqueIndex("price_id_user_id_unique")
      .on(table.priceId, table.userId)
      .where(inArray(table.status, ["creating", "open"])),
  ],
);

const db = drizzle(process.env.TEST_DB as string);

export async function recordCheckoutExpired({
  checkoutAttemptId,
  stripeSessionId,
}: {
  checkoutAttemptId: string;
  stripeSessionId: string;
}) {
  const [updated] = await db
    .update(testTable)
    .set({
      stripeSessionId,
      status: "expired",
    })
    .where(
      and(
        eq(testTable.id, checkoutAttemptId),
        or(
          eq(testTable.stripeSessionId, stripeSessionId),
          isNull(testTable.stripeSessionId),
        ),
        inArray(testTable.status, ["creating", "open", "expired"]),
      ),
    )
    .returning();

  if (!updated) {
    const [existing] = await db
      .select()
      .from(testTable)
      .where(eq(testTable.id, checkoutAttemptId));

    if (!existing) {
      throw new Error(
        "recordCheckoutExpired: Checkout Attempt with the given ID is not found",
      );
    }

    if (
      existing.stripeSessionId !== null &&
      existing.stripeSessionId !== stripeSessionId
    ) {
      throw new Error(
        "recordCheckoutExpired: Session ID conflicts with the saved Session",
      );
    }

    throw new Error(
      `recordCheckoutExpired: expiration was not applied; current attempt status is ${existing.status}`,
    );
  }

  return updated;
}

async function createCheckoutAttempt(data: typeof testTable.$inferInsert) {
  return await db.insert(testTable).values(data).returning();
}

async function getCheckoutAttempt(id: string) {
  return await db.select().from(testTable).where(eq(testTable.id, id));
}

async function main() {
  const userId = "user_A";
  const priceId = "price_A";

  const [attempt_A] = await createCheckoutAttempt({
    idempotencyKey: "key_A",
    userId,
    priceId,
    stripeSessionId: "session_A",
    status: "open",
  });

  await recordCheckoutExpired({
    checkoutAttemptId: attempt_A.id,
    stripeSessionId: "session_A",
  });

  const [attempt_A_row_1] = await getCheckoutAttempt(attempt_A.id);
  console.log("attempt_A_row_1 id:", attempt_A_row_1.id);
  console.log("attempt_A_row_1 status:", attempt_A_row_1.status);
  console.log("attempt_A_row_1 userId:", attempt_A_row_1.userId);
  console.log("attempt_A_row_1 priceId:", attempt_A_row_1.priceId);

  await recordCheckoutExpired({
    checkoutAttemptId: attempt_A.id,
    stripeSessionId: "session_A",
  });

  const [attempt_A_row_2] = await getCheckoutAttempt(attempt_A.id);
  console.log("attempt_A_row_2 id:", attempt_A_row_2.id);
  console.log("attempt_A_row_2 status:", attempt_A_row_2.status);
  console.log("attempt_A_row_2 userId:", attempt_A_row_2.userId);
  console.log("attempt_A_row_2 priceId:", attempt_A_row_2.priceId);

  const [attempt_B] = await createCheckoutAttempt({
    idempotencyKey: "key_B",
    userId,
    priceId,
  });

  const [attempt_B_row] = await getCheckoutAttempt(attempt_B.id);
  console.log("attempt_B_row id:", attempt_B_row.id);
  console.log("attempt_B_row status:", attempt_B_row.status);
  console.log("attempt_B_row userId:", attempt_B_row.userId);
  console.log("attempt_B_row priceId:", attempt_B_row.priceId);
}

main();

// npx dotenv -e .env -- npx tsx learning-labs/02-checkout-attempts/experiment-6.ts
