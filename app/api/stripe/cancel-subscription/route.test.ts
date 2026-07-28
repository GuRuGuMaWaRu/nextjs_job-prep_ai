jest.mock("@/core/lib/getCurrentUser", () => ({
  getCurrentUser: jest.fn(),
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

import { getCurrentUser } from "@/core/lib/getCurrentUser";
import {
  getStripe,
  getStripeBaseUrl,
  getIdempotencyKeyFromRequest,
  isStripeConfigured,
} from "@/core/features/billing/stripe";
import { TEST_USER_ID } from "@core/test-utils/constants";
import { makeProUser, makeUser } from "@core/test-utils/factories";
import { asStripeClient } from "@core/test-utils/mocks/stripe";

import { POST } from "./route";

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
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

    mockGetCurrentUser.mockReset();
    mockGetCurrentUser.mockResolvedValue(makeProUser({ id: TEST_USER_ID }));

    mockGetStripe.mockReset();
    mockGetStripe.mockReturnValue(asStripeClient(mockStripe));

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
    mockGetCurrentUser.mockResolvedValue(null);

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(
      response,
      "https://app.test/app/upgrade?error=unauthorized",
    );
    expect(mockGetStripe).not.toHaveBeenCalled();
    expect(mockStripe.subscriptions.update).not.toHaveBeenCalled();
  });

  it("redirects when the current user has no Stripe subscription id", async () => {
    mockGetCurrentUser.mockResolvedValue(
      makeUser({
        id: TEST_USER_ID,
        email: "billing-cancel-missing@test.local",
        stripeSubscriptionId: null,
      }),
    );

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(
      response,
      "https://app.test/app/upgrade?error=no_subscription",
    );
    expect(mockStripe.subscriptions.update).not.toHaveBeenCalled();
  });

  it("redirects when Stripe billing is not configured", async () => {
    mockIsStripeConfigured.mockReturnValue(false);

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(
      response,
      "https://app.test/app/upgrade?error=stripe_not_configured",
    );
    expect(mockGetStripe).not.toHaveBeenCalled();
    expect(mockStripe.subscriptions.update).not.toHaveBeenCalled();
  });

  it("redirects when the Stripe client is unavailable", async () => {
    mockGetStripe.mockReturnValue(null);

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(
      response,
      "https://app.test/app/upgrade?error=stripe_not_configured",
    );
    expect(mockStripe.subscriptions.update).not.toHaveBeenCalled();
  });

  it("sets the current subscription to cancel at period end", async () => {
    mockGetCurrentUser.mockResolvedValue(
      makeUser({
        id: TEST_USER_ID,
        stripeSubscriptionId: "sub_test_cancel",
      }),
    );

    mockStripe.subscriptions.update.mockResolvedValue({});

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
    mockGetCurrentUser.mockResolvedValue(
      makeUser({
        id: TEST_USER_ID,
        stripeSubscriptionId: "sub_test_cancel",
      }),
    );
    mockGetStripeBaseUrl.mockReturnValue(null);
    mockGetIdempotencyKeyFromRequest.mockResolvedValue(undefined);
    mockStripe.subscriptions.update.mockResolvedValue({});

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
    mockStripe.subscriptions.update.mockRejectedValue(
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
