import { drizzle } from "drizzle-orm/node-postgres";
import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { and, or, eq, inArray, isNull } from "drizzle-orm";

const statusEnum = pgEnum("status", [
  "creating",
  "open",
  "payment_pending",
  "completed",
  "failed",
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

async function recordCheckoutPaymentPending({
  checkoutAttemptId,
  stripeSessionId,
}: {
  checkoutAttemptId: string;
  stripeSessionId: string;
}) {
  const [result] = await db
    .update(testTable)
    .set({
      stripeSessionId,
      status: "payment_pending",
    })
    .where(
      and(
        eq(testTable.id, checkoutAttemptId),
        or(
          eq(testTable.stripeSessionId, stripeSessionId),
          isNull(testTable.stripeSessionId),
        ),
        inArray(testTable.status, ["creating", "open", "payment_pending"]),
      ),
    )
    .returning();

  if (!result) {
    const [alreadyCompleted] = await db
      .select()
      .from(testTable)
      .where(
        and(
          eq(testTable.id, checkoutAttemptId),
          eq(testTable.stripeSessionId, stripeSessionId),
          eq(testTable.status, "completed"),
        ),
      );

    if (alreadyCompleted) {
      return alreadyCompleted;
    }

    throw new Error(
      "updateCheckoutAttempt: Missing attempt, different Session ID, or another disallowed state",
    );
  }

  return result;
}

export async function recordCheckoutCompleted({
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
      status: "completed",
    })
    .where(
      and(
        eq(testTable.id, checkoutAttemptId),
        or(
          eq(testTable.stripeSessionId, stripeSessionId),
          isNull(testTable.stripeSessionId),
        ),
        inArray(testTable.status, [
          "creating",
          "open",
          "payment_pending",
          "completed",
        ]),
      ),
    )
    .returning();

  if (!updated) {
    throw new Error(
      "recordCheckoutCompleted: no matching Checkout Attempt found",
    );
  }

  return updated;
}

async function createCheckoutAttempt(data: typeof testTable.$inferInsert) {
  return await db.insert(testTable).values(data).returning();
}

async function removeCheckoutAttempt(id: string) {
  await db.delete(testTable).where(eq(testTable.id, id));
}

async function getCheckoutAttempt(id: string) {
  return await db.select().from(testTable).where(eq(testTable.id, id));
}

// npx dotenv -e .env -- npx tsx learning-labs/02-checkout-attempts/experiment-4.ts

async function main() {
  const [attempt_A] = await createCheckoutAttempt({
    idempotencyKey: "key_A",
    userId: "user_A",
    priceId: "price_A",
  });
  const result_A_pending = await recordCheckoutPaymentPending({
    checkoutAttemptId: attempt_A.id,
    stripeSessionId: "session_A",
  });
  console.log("attempt_A:", attempt_A.status);
  console.log("result_A_pending:", result_A_pending.status);

  const result_A_completed = await recordCheckoutCompleted({
    checkoutAttemptId: attempt_A.id,
    stripeSessionId: "session_A",
  });

  console.log("result_A_completed:", result_A_completed.status);

  const result_A_completed_2 = await recordCheckoutCompleted({
    checkoutAttemptId: attempt_A.id,
    stripeSessionId: "session_A",
  });

  console.log("result_A_completed_2:", result_A_completed_2.status);

  const result_A_pending_2 = await recordCheckoutPaymentPending({
    checkoutAttemptId: attempt_A.id,
    stripeSessionId: "session_A",
  });

  console.log("result_A_pending_2:", result_A_pending_2.status);

  const [final_row] = await getCheckoutAttempt(attempt_A.id);

  console.log("final_row:", final_row.status);
}

main();
