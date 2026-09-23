import type Stripe from "stripe";

export const STRIPE_WEBHOOK_EVENT_TYPES = {
  checkoutSessionCompleted: "checkout.session.completed",
  checkoutPaymentSucceeded: "checkout.session.async_payment_succeeded",
  subscriptionUpdated: "customer.subscription.updated",
  subscriptionDeleted: "customer.subscription.deleted",
} as const satisfies Record<string, Stripe.Event.Type>;
