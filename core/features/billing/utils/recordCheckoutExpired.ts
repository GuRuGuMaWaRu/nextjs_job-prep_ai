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
    const [existing] = await db
      .select()
      .from(CheckoutAttemptTable)
      .where(eq(CheckoutAttemptTable.id, checkoutAttemptId));

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
