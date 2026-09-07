import { drizzle } from "drizzle-orm/node-postgres";
import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { and, eq, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

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
    stripeCheckoutUrl: varchar("stripe_checkout_url"),
  },
  (table) => [
    uniqueIndex("price_id_user_id_unique")
      .on(table.priceId, table.userId)
      .where(inArray(table.status, ["creating", "open"])),
  ],
);

const db = drizzle(process.env.TEST_DB as string);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isActiveAttemptConflict(error: unknown) {
  if (!isRecord(error) || !isRecord(error.cause)) {
    return false;
  }

  return (
    error.cause.code === "23505" &&
    error.cause.constraint === "price_id_user_id_unique"
  );
}

async function getOrCreateActiveCheckoutAttempt(checkoutAttempt: {
  idempotencyKey: string;
  userId: string;
  priceId: string;
}) {
  try {
    const [created] = await db
      .insert(testTable)
      .values({
        idempotencyKey: checkoutAttempt.idempotencyKey,
        userId: checkoutAttempt.userId,
        priceId: checkoutAttempt.priceId,
      })
      .returning();

    return created;
  } catch (error) {
    if (!isActiveAttemptConflict(error)) {
      throw error;
    }

    const inserted = await db
      .select()
      .from(testTable)
      .where(
        and(
          eq(testTable.userId, checkoutAttempt.userId),
          eq(testTable.priceId, checkoutAttempt.priceId),
          inArray(testTable.status, ["creating", "open"]),
        ),
      );

    return inserted[0];
  }
}

class LabProvider {
  private sessions = new Map();
  private createSessionCount = 0;

  constructor() {}

  createSession(idempotencyKey: string) {
    this.increaseSessionCount();

    if (!this.sessions.has(idempotencyKey)) {
      this.sessions.set(idempotencyKey, {
        id: randomUUID(),
        checkoutURL: randomUUID(),
      });
    }

    return this.sessions.get(idempotencyKey);
  }

  getSessionCount() {
    return this.sessions.size;
  }

  getCreateSessionCallsCount() {
    return this.createSessionCount;
  }

  private increaseSessionCount() {
    this.createSessionCount += 1;
  }
}

const provider = new LabProvider();

async function createCheckout(
  checkoutData: {
    idempotencyKey: string;
    userId: string;
    priceId: string;
  },
  simulateCrash = false,
) {
  const attempt = await getOrCreateActiveCheckoutAttempt(checkoutData);

  if (attempt.status === "open") {
    return;
  }

  const session = provider.createSession(attempt.idempotencyKey);

  if (simulateCrash) {
    throw new Error("Simulated process crash");
  }

  await db
    .update(testTable)
    .set({
      status: "open",
      stripeSessionId: session.id,
      stripeCheckoutUrl: session.checkoutURL,
    })
    .where(eq(testTable.id, attempt.id));
}

async function main() {
  try {
    await createCheckout({
      idempotencyKey: "key_5",
      userId: "user_3",
      priceId: "price_pro",
    });
  } catch (_error) {
    console.log("Crash detected!");
  }

  const checkoutAttemptA = await db
    .select()
    .from(testTable)
    .where(
      and(
        eq(testTable.userId, "user_3"),
        eq(testTable.priceId, "price_pro"),
        inArray(testTable.status, ["creating", "open"]),
      ),
    );

  // console.log("checkoutAttemptA:", checkoutAttemptA);
  console.log(
    `DB: status: ${checkoutAttemptA[0].status}, session ID: ${checkoutAttemptA[0].stripeSessionId}, checkout URL: ${checkoutAttemptA[0].stripeCheckoutUrl}`,
  );
  console.log(`provider: ${provider.getSessionCount()} sessions`);
  console.log(`provider: ${provider.getCreateSessionCallsCount()} calls`);

  try {
    await createCheckout({
      idempotencyKey: "key_5",
      userId: "user_3",
      priceId: "price_pro",
    });
  } catch (_error) {
    console.log("Crash detected!");
  }

  const checkoutAttemptB = await db
    .select()
    .from(testTable)
    .where(
      and(
        eq(testTable.userId, "user_3"),
        eq(testTable.priceId, "price_pro"),
        inArray(testTable.status, ["creating", "open"]),
      ),
    );

  // console.log("checkoutAttemptB:", checkoutAttemptB);
  console.log(
    `DB: status: ${checkoutAttemptB[0].status}, session ID: ${checkoutAttemptB[0].stripeSessionId}, checkout URL: ${checkoutAttemptA[0].stripeCheckoutUrl}`,
  );
  console.log(`provider: ${provider.getSessionCount()} sessions`);
  console.log(`provider: ${provider.getCreateSessionCallsCount()} calls`);
}

main();

// npx dotenv -e .env -- npx tsx learning-labs/02-checkout-attempts/experiment.ts
