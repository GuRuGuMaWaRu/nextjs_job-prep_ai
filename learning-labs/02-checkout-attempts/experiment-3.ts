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

type Params = {
  checkoutAttemptId: string;
  stripeSessionId: string;
};

async function recordCheckoutPaymentPending({
  checkoutAttemptId,
  stripeSessionId,
}: Params) {
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

async function createCheckoutAttempt(data: typeof testTable.$inferInsert) {
  return await db.insert(testTable).values(data).returning();
}

async function removeCheckoutAttempt(id: string) {
  await db.delete(testTable).where(eq(testTable.id, id));
}

// npx dotenv -e .env -- npx tsx learning-labs/02-checkout-attempts/experiment-3.ts

async function main() {
  const [attempt_A] = await createCheckoutAttempt({
    idempotencyKey: "key_A",
    userId: "user_A",
    priceId: "price_A",
  });
  const result_A = await recordCheckoutPaymentPending({
    checkoutAttemptId: attempt_A.id,
    stripeSessionId: "session_B",
  });
  console.log("attempt_A:", attempt_A.status);
  console.log("result_A:", result_A.status);

  const [attempt_B] = await createCheckoutAttempt({
    idempotencyKey: "key_B",
    userId: "user_B",
    priceId: "price_B",
    status: "payment_pending",
    stripeSessionId: "session_B",
  });
  const result_B = await recordCheckoutPaymentPending({
    checkoutAttemptId: attempt_B.id,
    stripeSessionId: "session_B",
  });
  console.log("attempt_B:", attempt_B.status);
  console.log("result_B:", result_B.status);

  const [attempt_C] = await createCheckoutAttempt({
    idempotencyKey: "key_C",
    userId: "user_C",
    priceId: "price_C",
    status: "completed",
    stripeSessionId: "session_C",
  });
  const result_C = await recordCheckoutPaymentPending({
    checkoutAttemptId: attempt_C.id,
    stripeSessionId: "session_C",
  });
  console.log("attempt_C:", attempt_C.status);
  console.log("result_C:", result_C.status);

  const [attempt_D] = await createCheckoutAttempt({
    idempotencyKey: "key_D",
    userId: "user_D",
    priceId: "price_D",
    status: "completed",
    stripeSessionId: "session_D",
  });
  const result_D = await recordCheckoutPaymentPending({
    checkoutAttemptId: attempt_D.id,
    stripeSessionId: "session_A",
  });
  console.log("attempt_D:", attempt_D.status);
  console.log("result_D:", result_D.status);
}

main();
