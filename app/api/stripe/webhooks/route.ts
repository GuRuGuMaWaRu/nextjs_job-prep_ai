/**
 * Stripe webhook: updates user plan and Stripe IDs on checkout and subscription events.
 *
 * Local dev: Stripe cannot POST to localhost. Run the Stripe CLI to forward events:
 *   stripe listen --forward-to localhost:3000/api/stripe/webhooks
 * Then set STRIPE_WEBHOOK_SECRET in .env to the signing secret the CLI prints (whsec_...).
 */
import { NextResponse } from "next/server";
import Stripe from "stripe";

import {
  updateUserPlanAndStripeIdsDb,
  getUserByStripeCustomerIdDb,
} from "@/core/features/users/db";
import { getStripe } from "@/core/lib/stripe";
import { env } from "@/core/data/env/server";

const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"] as const;

function isActiveSubscriptionStatus(
  status: string,
): status is (typeof ACTIVE_SUBSCRIPTION_STATUSES)[number] {
  return ACTIVE_SUBSCRIPTION_STATUSES.includes(
    status as (typeof ACTIVE_SUBSCRIPTION_STATUSES)[number],
  );
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

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId as string | undefined;
        if (!userId) {
          console.warn("checkout.session.completed: missing metadata.userId");
          break;
        }
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? null;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? null;

        await updateUserPlanAndStripeIdsDb(userId, {
          plan: "pro",
          stripeCustomerId: customerId ?? undefined,
          stripeSubscriptionId: subscriptionId ?? undefined,
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;
        if (!customerId) break;

        const user = await getUserByStripeCustomerIdDb(customerId);
        if (!user) {
          console.warn(
            "customer.subscription.updated: no user for customer",
            customerId,
          );
          break;
        }

        const plan = isActiveSubscriptionStatus(subscription.status)
          ? "pro"
          : "free";
        await updateUserPlanAndStripeIdsDb(user.id, {
          plan,
          stripeSubscriptionId:
            plan === "pro" ? subscription.id : null,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;
        if (!customerId) break;

        const user = await getUserByStripeCustomerIdDb(customerId);
        if (!user) {
          console.warn(
            "customer.subscription.deleted: no user for customer",
            customerId,
          );
          break;
        }

        await updateUserPlanAndStripeIdsDb(user.id, {
          plan: "free",
          stripeSubscriptionId: null,
        });
        break;
      }

      default:
        // Unhandled event type; return 200 so Stripe does not retry
        break;
    }
  } catch (error) {
    console.error("Stripe webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 200 });
}
