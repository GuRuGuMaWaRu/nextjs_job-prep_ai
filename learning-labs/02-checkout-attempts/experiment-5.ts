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

async function main() {
  const [attempt_A] = await createCheckoutAttempt({
    idempotencyKey: "key_A",
    userId: "user_A",
    priceId: "price_A",
    stripeSessionId: "session_A",
  });
  const [attempt_B] = await createCheckoutAttempt({
    idempotencyKey: "key_B",
    userId: "user_B",
    priceId: "price_B",
    stripeSessionId: "session_B",
    status: "completed",
  });

  //** no such checkout attempt exists */
  try {
    await recordCheckoutExpired({
      checkoutAttemptId: randomUUID(),
      stripeSessionId: "session_A",
    });
  } catch (error) {
    console.log(error.message);
  }

  //** there is conflict with the saved Session ID  */
  try {
    await recordCheckoutExpired({
      checkoutAttemptId: attempt_A.id,
      stripeSessionId: "session_ABC",
    });
  } catch (error) {
    console.log(error.message);
  }

  //** saved checkout attempt has an unexpirable status  */
  try {
    await recordCheckoutExpired({
      checkoutAttemptId: attempt_B.id,
      stripeSessionId: "session_B",
    });
  } catch (error) {
    console.log(error.message);
  }
}

main();

// npx dotenv -e .env -- npx tsx learning-labs/02-checkout-attempts/experiment-5.ts
