import { and, eq, or, isNull, inArray } from "drizzle-orm";

import { db } from "@/core/drizzle/db";
import { CheckoutAttemptTable } from "@/core/drizzle/schema";

type Params = {
  checkoutAttemptId: string;
  stripeSessionId: string;
};

export async function recordCheckoutExpired({
  checkoutAttemptId,
  stripeSessionId,
}: Params) {
  const [updated] = await db
    .update(CheckoutAttemptTable)
    .set({
      stripeSessionId,
      status: "expired",
    })
    .where(
      and(
        eq(CheckoutAttemptTable.id, checkoutAttemptId),
        or(
          eq(CheckoutAttemptTable.stripeSessionId, stripeSessionId),
          isNull(CheckoutAttemptTable.stripeSessionId),
        ),
        inArray(CheckoutAttemptTable.status, ["creating", "open", "expired"]),
      ),
    )
    .returning();

  if (!updated) {
    throw new Error(
      "recordCheckoutExpired: relevant Checkout Attempt not found",
    );
  }

  return updated;
}
