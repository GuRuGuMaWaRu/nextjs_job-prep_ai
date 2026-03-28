/**
 * Stripe webhook: updates user plan and Stripe IDs on checkout and subscription events.
 *
 * Idempotency is guaranteed by two mechanisms:
 *   1. Every processed event ID is persisted in the stripe_events table.
 *      Duplicate deliveries (Stripe retries, network replays) are skipped unless
 *      the row is flagged `remediation_required` (unclaim failed after a handler
 *      error) — those return 500 so Stripe keeps retrying until ops fix the row.
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

import { syncSubscriptionFromStripe } from "@/core/features/users/stripeSync";
import { getStripe } from "@/core/lib/stripe";
import { toSafeErrorMeta } from "@/core/lib/toSafeErrorMeta";
import { env } from "@/core/data/env/server";
import {
  markStripeEventRemediationRequired,
  claimEvent,
  unclaimEvent,
  fulfillCheckoutSession,
  checkRemediationRequired,
} from "@/core/features/billing/webhookHelpers";

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
  const claimed = await claimEvent(event.id, event.type);
  if (!claimed) {
    const remediationRequired = await checkRemediationRequired(event.id);

    if (remediationRequired) {
      console.error(
        "[ALERT][stripe:webhook] duplicate delivery for event pending remediation — returning 500 so Stripe keeps retrying",
        { eventId: event.id, eventType: event.type },
      );
      return NextResponse.json(
        {
          error:
            "Stripe webhook event stuck after failed unclaim; remediation required",
        },
        { status: 500 },
      );
    }

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
      const unclaimMessage =
        unclaimErr instanceof Error ? unclaimErr.message : String(unclaimErr);

      console.error(
        "[ALERT][stripe:webhook] STUCK EVENT: unclaim failed after handler error; claim row remains — returning 500 and flagging row for remediation (duplicate ACK was unsafe until flagged)",
        {
          eventId: event.id,
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
            eventId: event.id,
            eventType: event.type,
            unclaimError: unclaimMessage,
            markError:
              markErr instanceof Error ? markErr.message : String(markErr),
          },
        );
      }
    }
    console.error("[stripe:webhook] handler failed", {
      eventId: event.id,
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
