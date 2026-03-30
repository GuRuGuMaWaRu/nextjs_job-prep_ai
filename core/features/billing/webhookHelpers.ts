// `REMEDIATION_DETAIL_MAX_LEN` must stay in sync with the `remediation_detail` varchar
// length in `core/drizzle/schema/stripeEvent.ts` (512). We truncate before insert so
// values never exceed that column; we only persist a short ops hint, not an unbounded error blob.
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

import { db } from "@/core/drizzle/db";
import { StripeEventTable } from "@/core/drizzle/schema";
import { updateUserPlanAndStripeIdsDb } from "@/core/features/users/db";

const REMEDIATION_DETAIL_MAX_LEN = 512;
const POSTGRES_UNDEFINED_COLUMN = "42703";

/** After `onConflictDoNothing`, a row might disappear before SELECT (e.g. concurrent `unclaimEvent`). */
const CLAIM_EVENT_MISSING_ROW_MAX_ATTEMPTS = 5;

function isMissingStripeEventSchemaError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const withCode = error as Error & { code?: string };
  return withCode.code === POSTGRES_UNDEFINED_COLUMN;
}

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

  try {
    await db
      .update(StripeEventTable)
      .set({
        state: "remediation_required",
        remediationDetail: truncated,
      })
      .where(eq(StripeEventTable.id, eventId));
  } catch (error) {
    // During deploy rollouts the app code can be newer than the DB schema.
    // Falling back preserves the previous webhook behavior until migrations land.
    if (isMissingStripeEventSchemaError(error)) {
      return;
    }

    throw error;
  }
}

/**
 * Marks a claimed event as fully handled so duplicate deliveries can be ACKed safely.
 */
export async function markStripeEventProcessed(eventId: string): Promise<void> {
  await db
    .update(StripeEventTable)
    .set({ state: "processed" })
    .where(eq(StripeEventTable.id, eventId));
}

export type ClaimEventResult =
  | "claimed"
  | "duplicate_processed"
  | "duplicate_in_progress"
  | "duplicate_remediation";

/**
 * Atomically attempts to claim an event for processing.
 * Inserts a row with `state = processing`. Concurrent deliveries that lose the
 * insert read the row: `processed` is a safe duplicate, `processing` must not
 * be ACKed until the winner finishes, `remediation_required` forces retry.
 */
export async function claimEvent(
  eventId: string,
  eventType: string,
): Promise<ClaimEventResult> {
  for (let attempt = 0; attempt < CLAIM_EVENT_MISSING_ROW_MAX_ATTEMPTS; attempt++) {
    const rows = await db
      .insert(StripeEventTable)
      .values({
        id: eventId,
        type: eventType,
        state: "processing",
      })
      .onConflictDoNothing()
      .returning({ id: StripeEventTable.id });

    if (rows.length > 0) {
      return "claimed";
    }

    const existing = await db
      .select({ state: StripeEventTable.state })
      .from(StripeEventTable)
      .where(eq(StripeEventTable.id, eventId))
      .limit(1);

    const row = existing[0];
    if (!row) {
      continue;
    }

    if (row.state === "processed") {
      return "duplicate_processed";
    }

    if (row.state === "remediation_required") {
      return "duplicate_remediation";
    }

    return "duplicate_in_progress";
  }

  return "duplicate_in_progress";
}

/**
 * Removes a previously claimed event so Stripe can retry delivery.
 * Called when event processing fails after a successful claim.
 */
export async function unclaimEvent(eventId: string): Promise<void> {
  await db.delete(StripeEventTable).where(eq(StripeEventTable.id, eventId));
}

/**
 * Applies Pro plan and Stripe customer/subscription IDs from a completed Checkout session.
 *
 * @param session — Stripe Checkout session (must include `metadata.userId` and resolved customer/subscription).
 * @returns Resolves when the user row is updated, or returns early if the session is unpaid or missing data.
 * @sideEffects Writes to the application database via `updateUserPlanAndStripeIdsDb`; may log non-sensitive warnings.
 */
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
