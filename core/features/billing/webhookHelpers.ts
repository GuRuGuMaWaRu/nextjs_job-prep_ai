// Must stay in sync with `remediation_detail` varchar length in
// `core/drizzle/schema/stripeEvent.ts` (512). We truncate so inserts never exceed
import { eq } from "drizzle-orm";
import Stripe from "stripe";

import { db } from "@/core/drizzle/db";
import { StripeEventTable } from "@/core/drizzle/schema";
import { updateUserPlanAndStripeIdsDb } from "@/core/features/users/db";

// the column and we only persist a short ops hint, not an unbounded error blob.
const REMEDIATION_DETAIL_MAX_LEN = 512;

/**
 * Flags a claimed event row as needing ops intervention (e.g. unclaim/delete failed).
 * Stripe retries must not ACK these as successfully processed duplicates.
 */
export async function markStripeEventRemediationRequired(
  eventId: string,
  detail: string,
): Promise<void> {
  const truncated =
    detail.length > REMEDIATION_DETAIL_MAX_LEN
      ? `${detail.slice(0, REMEDIATION_DETAIL_MAX_LEN - 3)}...`
      : detail;

  await db
    .update(StripeEventTable)
    .set({
      remediationRequired: true,
      remediationDetail: truncated,
    })
    .where(eq(StripeEventTable.id, eventId));
}

/**
 * Atomically attempts to claim an event for processing.
 * Uses INSERT ... ON CONFLICT DO NOTHING ... RETURNING so that only one of
 * potentially concurrent invocations for the same event ID "wins" the insert.
 *
 * Returns `true` if the event was successfully claimed (not yet processed).
 * Returns `false` if another invocation already claimed it (duplicate delivery).
 */
export async function claimEvent(
  eventId: string,
  eventType: string,
): Promise<boolean> {
  const rows = await db
    .insert(StripeEventTable)
    .values({ id: eventId, type: eventType })
    .onConflictDoNothing()
    .returning({ id: StripeEventTable.id });

  return rows.length > 0;
}

/**
 * Removes a previously claimed event so Stripe can retry delivery.
 * Called when event processing fails after a successful claim.
 */
export async function unclaimEvent(eventId: string): Promise<void> {
  await db.delete(StripeEventTable).where(eq(StripeEventTable.id, eventId));
}

export async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.payment_status === "unpaid") {
    return;
  }

  const userId = session.metadata?.userId as string | undefined;
  if (!userId) {
    console.warn("fulfillCheckoutSession: missing metadata.userId", session.id);
    return;
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : (session.subscription?.id ?? null);

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : (session.customer?.id ?? null);

  if (!customerId || !subscriptionId) {
    console.warn(
      "fulfillCheckoutSession: incomplete session payload — " +
        `customerId=${customerId}, subscriptionId=${subscriptionId}`,
      session.id,
    );
    return;
  }

  await updateUserPlanAndStripeIdsDb(userId, {
    plan: "pro",
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
  });
}

export async function checkRemediationRequired(
  eventId: string,
): Promise<boolean> {
  const existing = await db
    .select({
      remediationRequired: StripeEventTable.remediationRequired,
    })
    .from(StripeEventTable)
    .where(eq(StripeEventTable.id, eventId))
    .limit(1);

  const row = existing[0];
  return row?.remediationRequired ?? false;
}
