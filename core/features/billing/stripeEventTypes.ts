import type Stripe from "stripe";

export const STRIPE_WEBHOOK_EVENT_TYPES = {
  checkoutSessionCompleted: "checkout.session.completed",
  checkoutSessionAsyncPaymentSucceeded:
    "checkout.session.async_payment_succeeded",
  checkoutSessionAsyncPaymentFailed: "checkout.session.async_payment_failed",
  subscriptionUpdated: "customer.subscription.updated",
  subscriptionDeleted: "customer.subscription.deleted",
  invoiceVoided: "invoice.voided",
} as const satisfies Record<string, Stripe.Event.Type>;
