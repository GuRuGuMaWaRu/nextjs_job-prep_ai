let mockEnv: import("@core/test-utils/env").TestServerEnv;

jest.mock("@/core/data/env/server", () => ({
  get env() {
    return mockEnv;
  },
}));

jest.mock("@/core/features/auth/actions", () => ({
  getCurrentUserWithProfileAction: jest.fn(),
}));

jest.mock("@/core/features/billing/stripe", () => ({
  getStripe: jest.fn(),
  getStripeBaseUrl: jest.fn(),
  getIdempotencyKeyFromRequest: jest.fn(),
  getUpgradeErrorRedirect: jest.fn(
    (errorCode: string, baseUrl: string) =>
      `${baseUrl}/app/upgrade?error=${errorCode}`,
  ),
  isStripeConfigured: jest.fn(),
}));

import type Stripe from "stripe";

import { getCurrentUserWithProfileAction } from "@/core/features/auth/actions";
import {
  getStripe,
  getStripeBaseUrl,
  getIdempotencyKeyFromRequest,
  isStripeConfigured,
} from "@/core/features/billing/stripe";
import { TEST_USER_ID } from "@core/test-utils/constants";
import { createTestServerEnv } from "@core/test-utils/env";
import { makeUser } from "@core/test-utils/factories";

import { POST } from "./route";

const mockGetCurrentUserWithProfile =
  getCurrentUserWithProfileAction as jest.MockedFunction<
    typeof getCurrentUserWithProfileAction
  >;
const mockGetStripe = getStripe as jest.MockedFunction<typeof getStripe>;
const mockGetStripeBaseUrl = getStripeBaseUrl as jest.MockedFunction<
  typeof getStripeBaseUrl
>;
const mockGetIdempotencyKeyFromRequest =
  getIdempotencyKeyFromRequest as jest.MockedFunction<
    typeof getIdempotencyKeyFromRequest
  >;
const mockIsStripeConfigured = isStripeConfigured as jest.MockedFunction<
  typeof isStripeConfigured
>;

const mockStripe = {
  checkout: {
    sessions: {
      create: jest.fn(),
    },
  },
  products: {
    retrieve: jest.fn(),
  },
};

function buildJsonRequest(): Request {
  return new Request(
    "http://localhost:3000/api/stripe/create-checkout-session",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    },
  );
}

async function expectJsonRedirect(
  response: Response,
  redirectUrl: string,
): Promise<void> {
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({ redirectUrl });
}

describe("POST /api/stripe/create-checkout-session", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockEnv = createTestServerEnv({ STRIPE_PRO_PRICE_ID: "price_test_pro" });

    mockStripe.checkout.sessions.create.mockReset();
    mockStripe.products.retrieve.mockReset();

    mockGetCurrentUserWithProfile.mockReset();
    mockGetCurrentUserWithProfile.mockResolvedValue({
      userId: TEST_USER_ID,
      user: makeUser({
        id: TEST_USER_ID,
        email: "billing-checkout@test.local",
        stripeCustomerId: "cus_test_checkout",
      }),
      redirectToSignIn: jest.fn(() => {
        throw new Error("redirect");
      }),
    });

    mockGetStripe.mockReset();
    mockGetStripe.mockReturnValue(mockStripe as unknown as Stripe);

    mockGetStripeBaseUrl.mockReset();
    mockGetStripeBaseUrl.mockReturnValue("https://app.test");

    mockGetIdempotencyKeyFromRequest.mockReset();
    mockGetIdempotencyKeyFromRequest.mockResolvedValue("idem_test_checkout");

    mockIsStripeConfigured.mockReset();
    mockIsStripeConfigured.mockReturnValue(true);

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("redirects unauthenticated users to the upgrade unauthorized error", async () => {
    mockGetCurrentUserWithProfile.mockResolvedValueOnce({
      userId: null,
      redirectToSignIn: jest.fn(() => {
        throw new Error("redirect");
      }),
    });

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(
      response,
      "https://app.test/app/upgrade?error=unauthorized",
    );
    expect(mockGetStripe).not.toHaveBeenCalled();
    expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("redirects when the authenticated user's profile is unavailable", async () => {
    mockGetCurrentUserWithProfile.mockResolvedValueOnce({
      userId: TEST_USER_ID,
      redirectToSignIn: jest.fn(() => {
        throw new Error("redirect");
      }),
    });

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(
      response,
      "https://app.test/app/upgrade?error=user_not_found",
    );
    expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("creates a checkout session for an eligible user", async () => {
    mockStripe.checkout.sessions.create.mockResolvedValueOnce({
      url: "https://stripe.test/checkout/session",
    });

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(response, "https://stripe.test/checkout/session");
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      {
        mode: "subscription",
        line_items: [{ price: "price_test_pro", quantity: 1 }],
        success_url:
          "https://app.test/app/upgrade?success=true&session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "https://app.test/app/upgrade?canceled=true",
        metadata: { userId: TEST_USER_ID },
        customer: "cus_test_checkout",
      },
      { idempotencyKey: "idem_test_checkout" },
    );
  });

  it("redirects when Stripe rejects checkout session creation", async () => {
    mockStripe.checkout.sessions.create.mockRejectedValueOnce(
      new Error("stripe unavailable"),
    );

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(
      response,
      "https://app.test/app/upgrade?error=checkout_failed",
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Stripe checkout session creation failed:",
      expect.any(Error),
    );
  });
});
