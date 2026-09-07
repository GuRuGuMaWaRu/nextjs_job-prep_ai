import { eq, and, inArray } from "drizzle-orm";

import { db } from "@/core/drizzle/db";

import { CheckoutAttemptTable } from "@/core/drizzle/schema";

type StripeSessionData = {
  stripeSessionId: string;
  stripeCheckoutUrl: string | null;
  stripeExpiresAt: number;
};

export async function saveCheckoutSession(
  checkoutAttemptId: string,
  stripeSessionData: StripeSessionData,
) {
  const [updated] = await db
    .update(CheckoutAttemptTable)
    .set({
      stripeSessionId: stripeSessionData.stripeSessionId,
      stripeCheckoutUrl: stripeSessionData.stripeCheckoutUrl,
      stripeExpiresAt: new Date(stripeSessionData.stripeExpiresAt * 1000),
      status: "open",
    })
    .where(
      and(
        eq(CheckoutAttemptTable.id, checkoutAttemptId),
        inArray(CheckoutAttemptTable.status, ["creating"]),
      ),
    )
    .returning();

  if (updated) {
    return;
  }

  const [checkoutAttempt] = await db
    .select()
    .from(CheckoutAttemptTable)
    .where(
      and(
        eq(CheckoutAttemptTable.id, checkoutAttemptId),
        eq(
          CheckoutAttemptTable.stripeSessionId,
          stripeSessionData.stripeSessionId,
        ),
        inArray(CheckoutAttemptTable.status, ["open"]),
      ),
    );

  if (checkoutAttempt) {
    return;
  }

  throw new Error("Checkout attempt not found or already completed");
}
