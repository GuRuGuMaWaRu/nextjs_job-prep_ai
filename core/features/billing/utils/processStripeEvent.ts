import type Stripe from "stripe";

import { STRIPE_WEBHOOK_EVENT_TYPES } from "@/core/features/billing/stripeEventTypes";
import { syncSubscriptionFromStripe } from "@/core/features/users/stripeSync";
import { fulfillCheckoutSession } from "@/core/features/billing/webhookHelpers";
import { recordCheckoutExpired } from "@/core/features/billing/utils";

export async function processStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case STRIPE_WEBHOOK_EVENT_TYPES.checkoutSessionCompleted:
    case STRIPE_WEBHOOK_EVENT_TYPES.checkoutPaymentSucceeded: {
      const session = event.data.object as Stripe.Checkout.Session;
      await fulfillCheckoutSession(session);
      break;
    }

    case STRIPE_WEBHOOK_EVENT_TYPES.checkoutSessionExpired: {
      const session = event.data.object as Stripe.Checkout.Session;

      if (!session.metadata?.checkoutAttemptId) {
        break;
      }

      await recordCheckoutExpired({
        checkoutAttemptId: session.metadata.checkoutAttemptId,
        stripeSessionId: session.id,
      });
      break;
    }

    case STRIPE_WEBHOOK_EVENT_TYPES.subscriptionUpdated:
    case STRIPE_WEBHOOK_EVENT_TYPES.subscriptionDeleted: {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscriptionFromStripe(subscription);
      break;
    }

    default:
      console.warn(`[stripe:webhook] unhandled event type: ${event.type}`);
      break;
  }
}
