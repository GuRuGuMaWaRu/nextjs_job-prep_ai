jest.mock(
  "@/core/features/billing/utils/getOrCreateActiveCheckoutAttempt",
  () => ({
    getOrCreateActiveCheckoutAttempt: jest.fn(),
  }),
);
jest.mock("@/core/features/billing/utils/saveCheckoutSession", () => ({
  saveCheckoutSession: jest.fn(),
}));

import Stripe from "stripe";

import { startCheckout } from "@/core/features/billing/utils/startCheckout";
import { getOrCreateActiveCheckoutAttempt } from "@/core/features/billing/utils/getOrCreateActiveCheckoutAttempt";
import { saveCheckoutSession } from "@/core/features/billing/utils/saveCheckoutSession";

import { makeCheckoutAttempt } from "@/core/test-utils/factories";

const mockGetOrCreateActiveCheckoutAttempt = jest.mocked(
  getOrCreateActiveCheckoutAttempt,
);
const mockSaveCheckoutSession = jest.mocked(saveCheckoutSession);
const mockCreateStripeSession = jest.fn();

const stripe = {
  checkout: {
    sessions: {
      create: mockCreateStripeSession,
    },
  },
} as unknown as Stripe;

const STRIPE_CHECKOUT_TTL_MS = 24 * 60 * 60 * 1000; // Stripe default is 24h

describe("startCheckout", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns a previously saved Stripe Checkout URL when there is an already 'open' checkout attempt", async () => {
    const checkoutAttempt = makeCheckoutAttempt();

    mockGetOrCreateActiveCheckoutAttempt.mockResolvedValue(checkoutAttempt);

    const params = {
      userId: checkoutAttempt.userId,
      stripePriceId: checkoutAttempt.stripePriceId,
      stripeCustomerId: null,
      successUrl: checkoutAttempt.successUrl,
      cancelUrl: checkoutAttempt.cancelUrl,
      stripe,
    };

    const checkout = await startCheckout(params);

    expect(checkout).toBe("checkout_url_A");
    expect(mockCreateStripeSession).toHaveBeenCalledTimes(0);
    expect(mockSaveCheckoutSession).toHaveBeenCalledTimes(0);
  });

  it("returns a Stripe Session URL for a checkout attempt that was previously saved in database with 'creating' status", async () => {
    const stripeSession = {
      id: "session_A",
      url: "checkout_url_ABC",
      expires_at: Math.floor((Date.now() + STRIPE_CHECKOUT_TTL_MS) / 1000),
    };
    const checkoutAttempt = makeCheckoutAttempt({
      status: "creating",
      stripeSessionId: null,
      stripeCheckoutUrl: null,
      stripeExpiresAt: null,
    });

    mockGetOrCreateActiveCheckoutAttempt.mockResolvedValue(checkoutAttempt);
    mockCreateStripeSession.mockResolvedValue(stripeSession);

    const params = {
      userId: checkoutAttempt.userId,
      stripePriceId: checkoutAttempt.stripePriceId,
      stripeCustomerId: null,
      successUrl: "success_url_B", //** no matter the details we send to startCheckout we will use the details already saved for this checkout attempt */
      cancelUrl: checkoutAttempt.cancelUrl,
      stripe,
    };

    const checkout = await startCheckout(params);

    expect(mockCreateStripeSession).toHaveBeenCalledWith(
      {
        mode: "subscription",
        line_items: [{ price: checkoutAttempt.stripePriceId, quantity: 1 }],
        success_url: checkoutAttempt.successUrl,
        cancel_url: checkoutAttempt.cancelUrl,
        metadata: { userId: checkoutAttempt.userId },
      },
      {
        idempotencyKey: `checkout_attempt_${checkoutAttempt.id}`,
      },
    );
    expect(mockSaveCheckoutSession).toHaveBeenCalledWith(checkoutAttempt.id, {
      stripeSessionId: stripeSession.id,
      stripeCheckoutUrl: stripeSession.url,
      stripeExpiresAt: stripeSession.expires_at,
    });
    expect(checkout).toBe("checkout_url_ABC");
  });

  it("rejects when we create a session with Stripe yet saveCheckoutSession throws an error (e.g. Database is temporarily unavailable)", async () => {
    const stripeSession = {
      id: "session_A",
      url: "checkout_url_ABC",
      expires_at: Math.floor((Date.now() + STRIPE_CHECKOUT_TTL_MS) / 1000),
    };
    const checkoutAttempt = makeCheckoutAttempt({
      status: "creating",
      stripeSessionId: null,
      stripeCheckoutUrl: null,
      stripeExpiresAt: null,
    });

    mockGetOrCreateActiveCheckoutAttempt.mockResolvedValue(checkoutAttempt);
    mockCreateStripeSession.mockResolvedValue(stripeSession);
    mockSaveCheckoutSession.mockRejectedValue(
      new Error("Database is temporarily unavailable"),
    );

    const params = {
      userId: checkoutAttempt.userId,
      stripePriceId: checkoutAttempt.stripePriceId,
      stripeCustomerId: null,
      successUrl: checkoutAttempt.successUrl,
      cancelUrl: checkoutAttempt.cancelUrl,
      stripe,
    };

    await expect(startCheckout(params)).rejects.toThrow(
      "Database is temporarily unavailable",
    );

    expect(mockCreateStripeSession).toHaveBeenCalledWith(
      {
        mode: "subscription",
        line_items: [{ price: checkoutAttempt.stripePriceId, quantity: 1 }],
        success_url: checkoutAttempt.successUrl,
        cancel_url: checkoutAttempt.cancelUrl,
        metadata: { userId: checkoutAttempt.userId },
      },
      {
        idempotencyKey: `checkout_attempt_${checkoutAttempt.id}`,
      },
    );
    expect(mockSaveCheckoutSession).toHaveBeenCalledWith(checkoutAttempt.id, {
      stripeSessionId: stripeSession.id,
      stripeCheckoutUrl: stripeSession.url,
      stripeExpiresAt: stripeSession.expires_at,
    });
  });
});
