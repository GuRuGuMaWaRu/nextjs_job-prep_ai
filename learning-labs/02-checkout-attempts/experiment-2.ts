import { drizzle } from "drizzle-orm/node-postgres";
import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { and, eq, inArray } from "drizzle-orm";

const statusEnum = pgEnum("status", [
  "creating",
  "open",
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

type StripeSessionData = {
  stripeSessionId: string;
};

export async function saveCheckoutSession(
  checkoutAttemptId: string,
  stripeSessionData: StripeSessionData,
) {
  const [updated] = await db
    .update(testTable)
    .set({
      stripeSessionId: stripeSessionData.stripeSessionId,
      status: "open",
    })
    .where(
      and(
        eq(testTable.id, checkoutAttemptId),
        inArray(testTable.status, ["creating"]),
      ),
    )
    .returning();

  if (updated) {
    console.log("Checkout Attempt updated from 'creating' to 'open'");
    return;
  }

  const [checkoutAttempt] = await db
    .select()
    .from(testTable)
    .where(
      and(
        eq(testTable.id, checkoutAttemptId),
        eq(testTable.stripeSessionId, stripeSessionData.stripeSessionId),
        inArray(testTable.status, ["open"]),
      ),
    );

  if (checkoutAttempt) {
    console.log("This Checkout Attempt already is 'open'");
    return;
  }

  console.log("This Checkout Attempt is neither 'creating' nor 'open'");
  throw new Error("Checkout attempt not found or already completed");
}

// npx dotenv -e .env -- npx tsx learning-labs/02-checkout-attempts/experiment-2.ts

saveCheckoutSession("c32b3aad-415f-41db-87bf-56a3e7f75e88", {
  stripeSessionId: "session_A",
});
saveCheckoutSession("c32b3aad-415f-41db-87bf-56a3e7f75e88", {
  stripeSessionId: "session_B",
});
