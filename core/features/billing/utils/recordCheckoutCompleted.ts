import { and, or, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/core/drizzle/db";
import { CheckoutAttemptTable } from "@/core/drizzle/schema";

type Params = {
  checkoutAttemptId: string;
  stripeSessionId: string;
};

export async function recordCheckoutCompleted({
  checkoutAttemptId,
  stripeSessionId,
}: Params) {
  const [updated] = await db
    .update(CheckoutAttemptTable)
    .set({
      stripeSessionId,
      status: "completed",
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
