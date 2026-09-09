import { TEST_EXPIRED_AT_ISO } from "@/core/test-utils/constants";
import type { CheckoutAttemptStatus } from "@/core/drizzle/schema/checkoutAttempt";

let checkoutAttemptCounter = 0;

const STRIPE_CHECKOUT_TTL_MS = 24 * 60 * 60 * 1000; // Stripe default is 24h

function nextCheckoutAttemptIndex(): number {
  checkoutAttemptCounter += 1;
  return checkoutAttemptCounter;
}

export function makeCheckoutAttempt(overrides = {}) {
  const index = nextCheckoutAttemptIndex();

  return {
    id: `checkout-attempt-${index}`,
    userId: `user-${index}`,
    status: "open" as CheckoutAttemptStatus,
    stripePriceId: "price_A",
    stripeCustomerId: null,
    stripeSessionId: "session_A",
    stripeCheckoutUrl: "checkout_url_A",
    stripeExpiresAt: new Date(Date.now() + STRIPE_CHECKOUT_TTL_MS),
    successUrl: "success_url_A",
    cancelUrl: "cancel_url_A",
    commandVersion: 2,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), //** 8 hours ago */
    updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), //** 8 hours ago */
    ...overrides,
  };
}

export function makeExpiredCheckoutAttempt(overrides = {}) {
  return makeCheckoutAttempt({
    stripeExpiresAt: new Date(TEST_EXPIRED_AT_ISO),
    ...overrides,
  });
}
