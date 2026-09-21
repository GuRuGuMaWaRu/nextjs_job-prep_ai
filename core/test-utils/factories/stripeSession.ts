import Stripe from "stripe";

export function makeStripeSession(
  overrides: Partial<Stripe.Checkout.Session> = {},
) {
  const stripeSession = {
    id: overrides.id ? overrides.id : "stripe_session_A",
    metadata: overrides.metadata
      ? overrides.metadata
      : {
          userId: "user_A",
          checkoutAttemptId: "checkout_attempt_A",
        },
    status: overrides.status ? overrides.status : "creating",
    payment_status: overrides.payment_status
      ? overrides.payment_status
      : "unpaid",
  };

  return stripeSession as unknown as Stripe.Checkout.Session;
}
