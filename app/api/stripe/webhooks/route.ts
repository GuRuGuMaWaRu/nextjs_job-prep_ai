/**
 * Stripe webhook: updates user plan and Stripe IDs on checkout and subscription events.
 *
 * Idempotency is guaranteed by two mechanisms:
 *   1. Every processed event ID is persisted in the stripe_events table with an explicit
 *      `state` (processing → processed). Duplicate deliveries are skipped unless the row
 *      is `remediation_required` (unclaim failed after a handler error) — those return 500
 *      so Stripe keeps retrying until ops fix the row. While `state` is `processing`,
 *      concurrent duplicates receive 503 so Stripe retries instead of ACKing early.
 *   2. For subscription-lifecycle events the authoritative Subscription object
 *      is re-fetched from the Stripe API so that out-of-order delivery always
 *      applies the latest state rather than stale event payloads.
 *
 * Local dev: Stripe cannot POST to localhost. Run the Stripe CLI to forward events:
 *   stripe listen --forward-to localhost:3000/api/stripe/webhooks
 * Then set STRIPE_WEBHOOK_SECRET in .env to the signing secret the CLI prints (whsec_...).
 */
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { env } from "@/core/data/env/server";
import {
  markStripeEventRemediationRequired,
  claimEvent,
  unclaimEvent,
  fulfillCheckoutSession,
  markStripeEventProcessed,
} from "@/core/features/billing/webhookHelpers";
import { STRIPE_WEBHOOK_EVENT_TYPES } from "@/core/features/billing/stripeEventTypes";
import { syncSubscriptionFromStripe } from "@/core/features/users/stripeSync";
import { revalidateUserCache } from "@/core/features/users/dbCache";
import { getStripe } from "@/core/features/billing/stripe";
import { toSafeErrorMeta } from "@/core/lib/toSafeErrorMeta";

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
    return NextResponse.json(
      { error: "Missing stripe-signature" },
      { status: 400 },
    );
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ error: "Failed to read body" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── Idempotency: atomically claim the event ────────────────────────
  const claimResult = await claimEvent(event.id, event.type);

  if (claimResult === "duplicate_processed") {
    return new NextResponse(null, { status: 200 });
  }

  if (claimResult === "duplicate_in_progress") {
    return new NextResponse(null, { status: 503 });
  }

  if (claimResult === "duplicate_remediation") {
    console.error(
      "[ALERT][stripe:webhook] duplicate delivery for event pending remediation — returning 500 so Stripe keeps retrying",
      { eventType: event.type },
    );
    return NextResponse.json(
      {
        error:
          "Stripe webhook event stuck after failed unclaim; remediation required",
      },
      { status: 500 },
    );
  }

  try {
    switch (event.type) {
      case STRIPE_WEBHOOK_EVENT_TYPES.checkoutSessionCompleted:
      case STRIPE_WEBHOOK_EVENT_TYPES.checkoutSessionAsyncPaymentSucceeded: {
        const session = event.data.object as Stripe.Checkout.Session;
        const fulfilled = await fulfillCheckoutSession(session);
        const userId = session.metadata?.userId;
        if (fulfilled && userId) {
          revalidateUserCache(userId);
        }
        break;
      }

      case STRIPE_WEBHOOK_EVENT_TYPES.checkoutSessionAsyncPaymentFailed: {
        const session = event.data.object as Stripe.Checkout.Session;
        console.warn(
          `${STRIPE_WEBHOOK_EVENT_TYPES.checkoutSessionAsyncPaymentFailed}: async payment failed for checkout session`,
          "userId",
          session.metadata?.userId,
        );
        break;
      }

      case STRIPE_WEBHOOK_EVENT_TYPES.subscriptionUpdated: {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;
        if (!customerId) break;

        const updatedUserId = await syncSubscriptionFromStripe(
          stripe,
          subscription.id,
          customerId,
        );
        if (updatedUserId) {
          revalidateUserCache(updatedUserId);
        }
        break;
      }

      case STRIPE_WEBHOOK_EVENT_TYPES.subscriptionDeleted: {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;
        if (!customerId) break;

        const updatedUserId = await syncSubscriptionFromStripe(
          stripe,
          subscription.id,
          customerId,
        );
        if (updatedUserId) {
          revalidateUserCache(updatedUserId);
        }
        break;
      }

      default:
        break;
    }

    await markStripeEventProcessed(event.id);
  } catch (error) {
    try {
      await unclaimEvent(event.id);
    } catch (unclaimErr) {
      const unclaimMessage =
        unclaimErr instanceof Error ? unclaimErr.message : String(unclaimErr);

      console.error(
        "[ALERT][stripe:webhook] STUCK EVENT: unclaim failed after handler error; claim row remains — returning 500 and flagging row for remediation (duplicate ACK was unsafe until flagged)",
        {
          eventType: event.type,
          unclaimError: unclaimMessage,
        },
      );

      try {
        await markStripeEventRemediationRequired(event.id, unclaimMessage);
      } catch (markErr) {
        console.error(
          "[ALERT][stripe:webhook] failed to persist remediation flag for stuck event",
          {
            eventType: event.type,
            unclaimError: unclaimMessage,
            markError:
              markErr instanceof Error ? markErr.message : String(markErr),
          },
        );
      }
    }
    console.error("[stripe:webhook] handler failed", {
      eventType: event.type,
      error: toSafeErrorMeta(error),
    });
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 200 });
}
