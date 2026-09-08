import { createTestServerEnv } from "@core/test-utils/env";

let mockEnv = createTestServerEnv();

jest.mock("@/core/data/env/server", () => ({
  get env() {
    return mockEnv;
  },
}));

jest.mock("@/core/lib/getCurrentUser", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("@/core/features/billing/stripe", () => ({
  getStripe: jest.fn(),
  getStripeBaseUrl: jest.fn(),
  isStripeConfigured: jest.fn(),
}));

jest.mock("@/core/features/billing/utils", () => ({
  startCheckout: jest.fn(),
}));

import { startCheckout } from "@/core/features/billing/utils";
import { getCurrentUser } from "@/core/lib/getCurrentUser";
import {
  getStripe,
  getStripeBaseUrl,
  isStripeConfigured,
} from "@/core/features/billing/stripe";
import { TEST_USER_ID } from "@core/test-utils/constants";
import { makeUser } from "@core/test-utils/factories";
import { asStripeClient } from "@core/test-utils/mocks/stripe";

import { POST } from "./route";

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;
const mockGetStripe = getStripe as jest.MockedFunction<typeof getStripe>;
const mockGetStripeBaseUrl = getStripeBaseUrl as jest.MockedFunction<
  typeof getStripeBaseUrl
>;
const mockIsStripeConfigured = isStripeConfigured as jest.MockedFunction<
  typeof isStripeConfigured
>;
const mockStartCheckout = startCheckout as jest.MockedFunction<
  typeof startCheckout
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

    mockStartCheckout.mockReset();
    mockStartCheckout.mockResolvedValue("https://stripe.test/checkout/session");

    mockStripe.products.retrieve.mockReset();

    mockGetCurrentUser.mockReset();
    mockGetCurrentUser.mockResolvedValue(
      makeUser({
        id: TEST_USER_ID,
        email: "billing-checkout@test.local",
        stripeCustomerId: "cus_test_checkout",
      }),
    );

    mockGetStripe.mockReset();
    mockGetStripe.mockReturnValue(asStripeClient(mockStripe));

    mockGetStripeBaseUrl.mockReset();
    mockGetStripeBaseUrl.mockReturnValue("https://app.test");

    mockIsStripeConfigured.mockReset();
    mockIsStripeConfigured.mockReturnValue(true);

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("redirects unauthenticated users to the upgrade unauthorized error", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(
      response,
      "https://app.test/app/upgrade?error=unauthorized",
    );
    expect(mockGetStripe).not.toHaveBeenCalled();
    expect(mockStartCheckout).not.toHaveBeenCalled();
  });

  it("redirects when the user is not found", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(
      response,
      "https://app.test/app/upgrade?error=unauthorized",
    );
    expect(mockStartCheckout).not.toHaveBeenCalled();
  });

  it("redirects when Stripe billing is not configured", async () => {
    mockIsStripeConfigured.mockReturnValueOnce(false);

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(
      response,
      "https://app.test/app/upgrade?error=stripe_not_configured",
    );
    expect(mockGetStripe).not.toHaveBeenCalled();
    expect(mockStartCheckout).not.toHaveBeenCalled();
  });

  it("redirects when the Stripe client is unavailable", async () => {
    mockGetStripe.mockReturnValueOnce(null);

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(
      response,
      "https://app.test/app/upgrade?error=stripe_not_configured",
    );
    expect(mockStartCheckout).not.toHaveBeenCalled();
  });

  it("redirects when no checkout price can be resolved", async () => {
    mockEnv = createTestServerEnv({
      STRIPE_PRO_PRICE_ID: "",
      STRIPE_PRO_PRODUCT_ID: "",
    });

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(
      response,
      "https://app.test/app/upgrade?error=config",
    );
    expect(mockStripe.products.retrieve).not.toHaveBeenCalled();
    expect(mockStartCheckout).not.toHaveBeenCalled();
  });

  it("redirects when the configured product has no default price", async () => {
    mockEnv = createTestServerEnv({
      STRIPE_PRO_PRICE_ID: "",
      STRIPE_PRO_PRODUCT_ID: "prod_test_pro",
    });
    mockStripe.products.retrieve.mockResolvedValueOnce({
      default_price: null,
    });

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(
      response,
      "https://app.test/app/upgrade?error=config",
    );
    expect(mockStripe.products.retrieve).toHaveBeenCalledWith("prod_test_pro", {
      expand: ["default_price"],
    });
    expect(mockStartCheckout).not.toHaveBeenCalled();
  });

  it("uses the configured product's string default price", async () => {
    mockEnv = createTestServerEnv({
      STRIPE_PRO_PRICE_ID: "",
      STRIPE_PRO_PRODUCT_ID: "prod_test_pro",
    });
    mockStripe.products.retrieve.mockResolvedValueOnce({
      default_price: "price_test_product",
    });
    mockStartCheckout.mockResolvedValueOnce(
      "https://stripe.test/checkout/product-price",
    );

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(
      response,
      "https://stripe.test/checkout/product-price",
    );
    expect(mockStartCheckout).toHaveBeenCalledWith({
      userId: TEST_USER_ID,
      stripePriceId: "price_test_product",
      stripeCustomerId: "cus_test_checkout",
      successUrl:
        "https://app.test/api/stripe/checkout-return?session_id={CHECKOUT_SESSION_ID}",
      cancelUrl: "https://app.test/app/upgrade?canceled=true",
      stripe: mockStripe,
    });
  });

  it("redirects users who already have a Pro plan", async () => {
    mockGetCurrentUser.mockResolvedValueOnce(
      makeUser({
        id: TEST_USER_ID,
        email: "billing-checkout-pro@test.local",
        plan: "pro",
      }),
    );

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(
      response,
      "https://app.test/app/upgrade?error=already_pro",
    );
    expect(mockStartCheckout).not.toHaveBeenCalled();
  });

  it("redirects users who already have a Stripe subscription", async () => {
    mockGetCurrentUser.mockResolvedValueOnce(
      makeUser({
        id: TEST_USER_ID,
        email: "billing-checkout-subscribed@test.local",
        stripeSubscriptionId: "sub_test_existing",
      }),
    );

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(
      response,
      "https://app.test/app/upgrade?error=existing_subscription",
    );
    expect(mockStartCheckout).not.toHaveBeenCalled();
  });

  it("creates a checkout session for an eligible user", async () => {
    mockStartCheckout.mockResolvedValueOnce(
      "https://stripe.test/checkout/session",
    );

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(response, "https://stripe.test/checkout/session");
    expect(mockStartCheckout).toHaveBeenCalledWith({
      userId: TEST_USER_ID,
      stripePriceId: "price_test_pro",
      stripeCustomerId: "cus_test_checkout",
      successUrl:
        "https://app.test/api/stripe/checkout-return?session_id={CHECKOUT_SESSION_ID}",
      cancelUrl: "https://app.test/app/upgrade?canceled=true",
      stripe: mockStripe,
    });
  });

  it("redirects when Stripe rejects checkout session creation", async () => {
    mockStartCheckout.mockRejectedValueOnce(new Error("stripe unavailable"));

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
