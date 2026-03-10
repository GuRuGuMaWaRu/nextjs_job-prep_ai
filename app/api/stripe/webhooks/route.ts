/**
 * Stripe webhook: updates user plan and Stripe IDs on checkout and subscription events.
 *
 * Idempotency is guaranteed by two mechanisms:
 *   1. Every processed event ID is persisted in the stripe_events table.
 *      Duplicate deliveries (Stripe retries, network replays) are skipped.
 *   2. For subscription-lifecycle events the authoritative Subscription object
 *      is re-fetched from the Stripe API so that out-of-order delivery always
 *      applies the latest state rather than stale event payloads.
 *
 * Local dev: Stripe cannot POST to localhost. Run the Stripe CLI to forward events:
 *   stripe listen --forward-to localhost:3000/api/stripe/webhooks
 * Then set STRIPE_WEBHOOK_SECRET in .env to the signing secret the CLI prints (whsec_...).
 */
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { eq } from "drizzle-orm";

import {
  updateUserPlanAndStripeIdsDb,
  getUserByStripeCustomerIdDb,
} from "@/core/features/users/db";
import { getStripe } from "@/core/lib/stripe";
import { env } from "@/core/data/env/server";
import { db } from "@/core/drizzle/db";
import { StripeEventTable } from "@/core/drizzle/schema";

const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"] as const;

const TERMINAL_SUBSCRIPTION_STATUSES = [
  "canceled",
  "incomplete_expired",
] as const;

function isActiveSubscriptionStatus(
  status: string,
): status is (typeof ACTIVE_SUBSCRIPTION_STATUSES)[number] {
  return ACTIVE_SUBSCRIPTION_STATUSES.includes(
    status as (typeof ACTIVE_SUBSCRIPTION_STATUSES)[number],
  );
}

function isTerminalSubscriptionStatus(
  status: string,
): status is (typeof TERMINAL_SUBSCRIPTION_STATUSES)[number] {
  return TERMINAL_SUBSCRIPTION_STATUSES.includes(
    status as (typeof TERMINAL_SUBSCRIPTION_STATUSES)[number],
  );
}

/**
 * Atomically attempts to claim an event for processing.
 * Uses INSERT ... ON CONFLICT DO NOTHING ... RETURNING so that only one of
 * potentially concurrent invocations for the same event ID "wins" the insert.
 *
 * Returns `true` if the event was successfully claimed (not yet processed).
 * Returns `false` if another invocation already claimed it (duplicate delivery).
 */
async function claimEvent(
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
async function unclaimEvent(eventId: string): Promise<void> {
  await db.delete(StripeEventTable).where(eq(StripeEventTable.id, eventId));
}

async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
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
      : session.subscription?.id ?? null;

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

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

/**
 * Re-fetches the subscription from Stripe and applies the authoritative state
 * to the local DB. This protects against out-of-order webhook delivery:
 * regardless of which event triggered this call, the user always ends up with
 * the latest Stripe-side subscription status.
 */
async function syncSubscriptionFromStripe(
  stripe: Stripe,
  subscriptionId: string,
  customerId: string,
) {
  const user = await getUserByStripeCustomerIdDb(customerId);
  if (!user) {
    throw new Error(
      `syncSubscriptionFromStripe: no user for customer ${customerId} — will retry`,
    );
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const plan = isActiveSubscriptionStatus(subscription.status) ? "pro" : "free";
  const terminal = isTerminalSubscriptionStatus(subscription.status);

  await updateUserPlanAndStripeIdsDb(user.id, {
    plan,
    stripeSubscriptionId: terminal ? null : subscription.id,
  });
}

export async function POST(request: Request) {
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 501 },
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 501 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json(
      { error: "Failed to read body" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── Idempotency: atomically claim the event ────────────────────────
  const claimed = await claimEvent(event.id, event.type);
  if (!claimed) {
    return new NextResponse(null, { status: 200 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await fulfillCheckoutSession(session);
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        await fulfillCheckoutSession(session);
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.warn(
          "checkout.session.async_payment_failed: session",
          session.id,
          "userId",
          session.metadata?.userId,
        );
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;
        if (!customerId) break;

        await syncSubscriptionFromStripe(stripe, subscription.id, customerId);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;
        if (!customerId) break;

        await syncSubscriptionFromStripe(stripe, subscription.id, customerId);
        break;
      }

      default:
        break;
    }
  } catch (error) {
    try {
      await unclaimEvent(event.id);
    } catch (unclaimErr) {
      console.error(
        "Stripe webhook: unclaimEvent failed (event remains claimed); Stripe will retry:",
        unclaimErr,
      );
    }
    console.error("Stripe webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 200 });
}
