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

import { getCurrentUserWithProfileAction } from "@/core/features/auth/actions";
import {
  getStripe,
  getStripeBaseUrl,
  getIdempotencyKeyFromRequest,
  isStripeConfigured,
} from "@/core/features/billing/stripe";
import { TEST_USER_ID } from "@core/test-utils/constants";
import { makeUser } from "@core/test-utils/factories";
import { asStripeClient } from "@core/test-utils/mocks/stripe";

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
  billingPortal: {
    sessions: {
      create: jest.fn(),
    },
  },
};

function buildJsonRequest(): Request {
  return new Request("http://localhost:3000/api/stripe/create-portal-session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
}

function buildFormRequest(): Request {
  return new Request("http://localhost:3000/api/stripe/create-portal-session", {
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

describe("POST /api/stripe/create-portal-session", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockStripe.billingPortal.sessions.create.mockReset();

    mockGetCurrentUserWithProfile.mockReset();
    mockGetCurrentUserWithProfile.mockResolvedValue({
      userId: TEST_USER_ID,
      user: makeUser({
        id: TEST_USER_ID,
        email: "billing-portal@test.local",
        stripeCustomerId: "cus_test_portal",
      }),
      redirectToSignIn: jest.fn(() => {
        throw new Error("redirect");
      }),
    });

    mockGetStripe.mockReset();
    mockGetStripe.mockReturnValue(asStripeClient(mockStripe));

    mockGetStripeBaseUrl.mockReset();
    mockGetStripeBaseUrl.mockReturnValue("https://app.test");

    mockGetIdempotencyKeyFromRequest.mockReset();
    mockGetIdempotencyKeyFromRequest.mockResolvedValue("idem_test_portal");

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
    expect(mockStripe.billingPortal.sessions.create).not.toHaveBeenCalled();
  });

  it("redirects when the current user has no Stripe customer id", async () => {
    mockGetCurrentUserWithProfile.mockResolvedValueOnce({
      userId: TEST_USER_ID,
      user: makeUser({
        id: TEST_USER_ID,
        email: "billing-portal-missing@test.local",
        stripeCustomerId: null,
      }),
      redirectToSignIn: jest.fn(() => {
        throw new Error("redirect");
      }),
    });

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(
      response,
      "https://app.test/app/upgrade?error=no_customer",
    );
    expect(mockStripe.billingPortal.sessions.create).not.toHaveBeenCalled();
  });

  it("redirects when Stripe billing is not configured", async () => {
    mockIsStripeConfigured.mockReturnValueOnce(false);

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(
      response,
      "https://app.test/app/upgrade?error=stripe_not_configured",
    );
    expect(mockGetStripe).not.toHaveBeenCalled();
    expect(mockStripe.billingPortal.sessions.create).not.toHaveBeenCalled();
  });

  it("redirects when the Stripe client is unavailable", async () => {
    mockGetStripe.mockReturnValueOnce(null);

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(
      response,
      "https://app.test/app/upgrade?error=stripe_not_configured",
    );
    expect(mockStripe.billingPortal.sessions.create).not.toHaveBeenCalled();
  });

  it("creates a billing portal session for a user with a Stripe customer", async () => {
    mockStripe.billingPortal.sessions.create.mockResolvedValueOnce({
      url: "https://stripe.test/billing/portal",
    });

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(response, "https://stripe.test/billing/portal");
    expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith(
      {
        customer: "cus_test_portal",
        return_url: "https://app.test/app/upgrade",
      },
      { idempotencyKey: "idem_test_portal" },
    );
  });

  it("redirects with 302 when JSON is not requested", async () => {
    mockGetStripeBaseUrl.mockReturnValueOnce(null);
    mockGetIdempotencyKeyFromRequest.mockResolvedValueOnce(undefined);
    mockStripe.billingPortal.sessions.create.mockResolvedValueOnce({
      url: "https://stripe.test/billing/redirect",
    });

    const response = await POST(buildFormRequest());

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://stripe.test/billing/redirect",
    );
    expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith(
      {
        customer: "cus_test_portal",
        return_url: "http://localhost:3000/app/upgrade",
      },
      undefined,
    );
  });

  it("redirects when Stripe rejects billing portal session creation", async () => {
    mockStripe.billingPortal.sessions.create.mockRejectedValueOnce(
      new Error("stripe unavailable"),
    );

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(
      response,
      "https://app.test/app/upgrade?error=portal_failed",
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Stripe portal session creation failed:",
      expect.any(Error),
    );
  });

  it("redirects when Stripe creates a billing portal session without a URL", async () => {
    mockStripe.billingPortal.sessions.create.mockResolvedValueOnce({});

    const response = await POST(buildJsonRequest());

    await expectJsonRedirect(
      response,
      "https://app.test/app/upgrade?error=portal_failed",
    );
  });
});
