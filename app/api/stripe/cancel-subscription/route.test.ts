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
import { makeProUser, makeUser } from "@core/test-utils/factories";

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
  subscriptions: {
    update: jest.fn(),
  },
};

function buildJsonRequest(): Request {
  return new Request("http://localhost:3000/api/stripe/cancel-subscription", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
}

function buildFormRequest(): Request {
  return new Request("http://localhost:3000/api/stripe/cancel-subscription", {
    method: "POST",
  });
}

async function expectJsonRedirect(
  response: Response,
  redirectUrl: string,
): Promise<void> {
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({ redirectUrl });
}

describe("POST /api/stripe/cancel-subscription", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockStripe.subscriptions.update.mockReset();

    mockGetCurrentUserWithProfile.mockReset();
    mockGetCurrentUserWithProfile.mockResolvedValue({
      userId: TEST_USER_ID,
      user: makeProUser({
        id: TEST_USER_ID,
        email: "billing-cancel@test.local",
        stripeSubscriptionId: "sub_test_cancel",
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
    mockGetIdempotencyKeyFromRequest.mockResolvedValue("idem_test_cancel");

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
    expect(mockStripe.subscriptions.update).not.toHaveBeenCalled();
  });

  it("redirects when the current user has no Stripe subscription id", async () => {
    mockGetCurrentUserWithProfile.mockResolvedValueOnce({
      userId: TEST_USER_ID,
      user: makeUser({
        id: TEST_USER_ID,
        email: "billing-cancel-missing@test.local",
        stripeSubscriptionId: null,
      }),
      redirectToSignIn: jest.fn(() => {
        throw new Error("redirect");
      }),
    });

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(
      response,
      "https://app.test/app/upgrade?error=no_subscription",
    );
    expect(mockStripe.subscriptions.update).not.toHaveBeenCalled();
  });

  it("redirects when Stripe billing is not configured", async () => {
    mockIsStripeConfigured.mockReturnValueOnce(false);

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(
      response,
      "https://app.test/app/upgrade?error=stripe_not_configured",
    );
    expect(mockGetStripe).not.toHaveBeenCalled();
    expect(mockStripe.subscriptions.update).not.toHaveBeenCalled();
  });

  it("redirects when the Stripe client is unavailable", async () => {
    mockGetStripe.mockReturnValueOnce(null);

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(
      response,
      "https://app.test/app/upgrade?error=stripe_not_configured",
    );
    expect(mockStripe.subscriptions.update).not.toHaveBeenCalled();
  });

  it("sets the current subscription to cancel at period end", async () => {
    mockStripe.subscriptions.update.mockResolvedValueOnce({});

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(
      response,
      "https://app.test/app/upgrade?canceled_subscription=true",
    );
    expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
      "sub_test_cancel",
      { cancel_at_period_end: true },
      { idempotencyKey: "idem_test_cancel" },
    );
  });

  it("redirects with 302 when JSON is not requested", async () => {
    mockGetStripeBaseUrl.mockReturnValueOnce(null);
    mockGetIdempotencyKeyFromRequest.mockResolvedValueOnce(undefined);
    mockStripe.subscriptions.update.mockResolvedValueOnce({});

    const response = await POST(buildFormRequest());

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/app/upgrade?canceled_subscription=true",
    );
    expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
      "sub_test_cancel",
      { cancel_at_period_end: true },
      undefined,
    );
  });

  it("redirects when Stripe rejects the subscription update", async () => {
    mockStripe.subscriptions.update.mockRejectedValueOnce(
      new Error("stripe unavailable"),
    );

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(
      response,
      "https://app.test/app/upgrade?error=cancel_failed",
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Stripe cancel subscription error:",
      expect.any(Error),
    );
  });
});
