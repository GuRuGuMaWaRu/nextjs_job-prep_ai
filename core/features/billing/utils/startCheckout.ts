import Stripe from "stripe";

import { getOrCreateActiveCheckoutAttempt } from "./getOrCreateActiveCheckoutAttempt";
import { saveCheckoutSession } from "./saveCheckoutSession";

type StartCheckoutParams = {
  userId: string;
  stripePriceId: string;
  stripeCustomerId: string | null;
  successUrl: string;
  cancelUrl: string;
  stripe: Stripe;
};

export async function startCheckout({
  userId,
  stripePriceId,
  stripeCustomerId,
  successUrl,
  cancelUrl,
  stripe,
}: StartCheckoutParams) {
  const checkoutAttempt = await getOrCreateActiveCheckoutAttempt({
    userId,
    stripePriceId,
    successUrl,
    cancelUrl,
    stripeCustomerId,
  });

  if (
    checkoutAttempt.status === "open" &&
    checkoutAttempt.stripeSessionId &&
    checkoutAttempt.stripeCheckoutUrl &&
    checkoutAttempt.stripeExpiresAt &&
    checkoutAttempt.stripeExpiresAt.getTime() > Date.now()
  ) {
    return checkoutAttempt.stripeCheckoutUrl;
  }

  if (checkoutAttempt.status === "open") {
    throw new Error(
      "Open checkout attempt has missing or expired session data",
    );
  }

  if (checkoutAttempt.status !== "creating") {
    throw new Error(
      "Checkout attempt cannot create a session in its current state",
    );
  }

  //** TODO: do I need this explicit typing? */
  const sessionParams: {
    mode: "subscription";
    line_items: [{ price: string; quantity: number }];
    success_url: string;
    cancel_url: string;
    metadata: { userId: string };
    customer?: string;
  } = {
    mode: "subscription",
    line_items: [{ price: checkoutAttempt.stripePriceId, quantity: 1 }],
    success_url: checkoutAttempt.successUrl,
    cancel_url: checkoutAttempt.cancelUrl,
    metadata: { userId: checkoutAttempt.userId },
  };

  if (checkoutAttempt.stripeCustomerId != null) {
    sessionParams.customer = checkoutAttempt.stripeCustomerId;
  }

  const session = await stripe.checkout.sessions.create(sessionParams, {
    idempotencyKey: `checkout_attempt_${checkoutAttempt.id}`,
  });

  //** TODO: should I even check for a possibility where session.url is null? */
  if (!session.url) {
    throw new Error("Stripe checkout session creation failed: no URL");
  }

  await saveCheckoutSession(checkoutAttempt.id, {
    stripeSessionId: session.id,
    stripeCheckoutUrl: session.url,
    stripeExpiresAt: session.expires_at,
  });

  return session.url;
}
