import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/core/drizzle/db";
import { CheckoutAttemptTable } from "@/core/drizzle/schema";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isActiveAttemptConflict(error: unknown) {
  if (!isRecord(error) || !isRecord(error.cause)) {
    return false;
  }

  return (
    error.cause.code === "23505" &&
    error.cause.constraint === "checkout_attempts_live_user_price_unique"
  );
}

export type CheckoutAttempt = Pick<
  typeof CheckoutAttemptTable.$inferInsert,
  "userId" | "stripePriceId" | "successUrl" | "cancelUrl"
> & { stripeCustomerId: string | null };

export async function getOrCreateActiveCheckoutAttempt(
  checkoutAttempt: CheckoutAttempt,
) {
  try {
    const [created] = await db
      .insert(CheckoutAttemptTable)
      .values(checkoutAttempt)
      .returning();

    return created;
  } catch (error) {
    if (!isActiveAttemptConflict(error)) {
      throw error;
    }

    const inserted = await db
      .select()
      .from(CheckoutAttemptTable)
      .where(
        and(
          eq(CheckoutAttemptTable.userId, checkoutAttempt.userId),
          eq(CheckoutAttemptTable.stripePriceId, checkoutAttempt.stripePriceId),
          inArray(CheckoutAttemptTable.status, [
            "creating",
            "open",
            "payment_pending",
          ]),
        ),
      );

    if (!inserted[0]) {
      throw error;
    }

    return inserted[0];
  }
}
