/**
 * Factory for stubbing the Stripe SDK client in Jest.
 *
 * The webhook route calls `getStripe()` and then uses the returned client's
 * `webhooks.constructEvent` (signature verification) and `subscriptions.retrieve`
 * (subscription sync). The mock exposes both as `jest.fn()`s so tests can
 * control return values and assert call shapes.
 *
 * Tests that exercise `@/core/features/billing/stripe` typically replace
 * `getStripe` itself via `jest.mock`; the Stripe SDK is not re-implemented
 * here — only the surface the route consumes.
 *
 * @example
 *   const stripe = createMockStripe();
 *   stripe.webhooks.constructEvent.mockReturnValue(event);
 *
 *   jest.mock("@/core/features/billing/stripe", () => ({
 *     getStripe: () => stripe,
 *   }));
 */

import type Stripe from "stripe";

export type MockStripeClient = {
  webhooks: {
    constructEvent: jest.Mock<
      Stripe.Event,
      [string | Buffer, string | string[], string]
    >;
  };
  subscriptions: {
    retrieve: jest.Mock<Promise<Stripe.Subscription>, [string]>;
    list: jest.Mock<
      Promise<Stripe.ApiList<Stripe.Subscription>>,
      [Stripe.SubscriptionListParams]
    >;
  };
};

/**
 * Returns a fresh stripe client mock with the minimal surface the app uses.
 *
 * `constructEvent` is a bare `jest.fn()` — set a return value per test to
 * simulate a valid signature, or `mockImplementation(() => { throw … })` to
 * simulate verification failure.
 */
export function createMockStripe(): MockStripeClient {
  return {
    webhooks: {
      constructEvent: jest.fn(),
    },
    subscriptions: {
      retrieve: jest.fn(),
      list: jest.fn(),
    },
  };
}
