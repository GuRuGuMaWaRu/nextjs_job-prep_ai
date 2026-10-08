import type Stripe from "stripe";

import { db } from "@/core/drizzle/db";
import { StripeEventTable } from "@/core/drizzle/schema";

export async function storeStripeEvent(event: Stripe.Event) {
  const [inserted] = await db
    .insert(StripeEventTable)
    .values({
      id: event.id,
      type: event.type,
      state: "pending",
      payload: event,
    })
    .onConflictDoNothing({ target: StripeEventTable.id })
    .returning();

  return inserted;
}
