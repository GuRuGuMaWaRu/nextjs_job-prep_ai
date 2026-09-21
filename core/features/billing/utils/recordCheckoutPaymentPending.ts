import { and, or, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/core/drizzle/db";
import { CheckoutAttemptTable } from "@/core/drizzle/schema";

type Params = {
  checkoutAttemptId: string;
  stripeSessionId: string;
};

export async function recordCheckoutPaymentPending({
  checkoutAttemptId,
  stripeSessionId,
}: Params) {
  const [result] = await db
    .update(CheckoutAttemptTable)
    .set({
      stripeSessionId,
      status: "payment_pending",
    })
    .where(
      and(
        eq(CheckoutAttemptTable.id, checkoutAttemptId),
        or(
          eq(CheckoutAttemptTable.stripeSessionId, stripeSessionId),
          isNull(CheckoutAttemptTable.stripeSessionId),
        ),
        inArray(CheckoutAttemptTable.status, [
          "creating",
          "open",
          "payment_pending",
        ]),
      ),
    )
    .returning();

  if (!result) {
    const [alreadyCompleted] = await db
      .select()
      .from(CheckoutAttemptTable)
      .where(
        and(
          eq(CheckoutAttemptTable.id, checkoutAttemptId),
          eq(CheckoutAttemptTable.stripeSessionId, stripeSessionId),
          eq(CheckoutAttemptTable.status, "completed"),
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
