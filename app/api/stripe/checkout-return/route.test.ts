jest.mock("@/core/lib/getCurrentUser", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("@/core/features/billing/stripe", () => ({
  getStripe: jest.fn(),
  getStripeBaseUrl: jest.fn(),
  isStripeConfigured: jest.fn(),
}));

jest.mock("@/core/features/billing/webhookHelpers", () => ({
  fulfillCheckoutSession: jest.fn(),
}));

import { NextRequest } from "next/server";
import type Stripe from "stripe";

import { getCurrentUser } from "@/core/lib/getCurrentUser";
import {
  getStripe,
  getStripeBaseUrl,
  isStripeConfigured,
} from "@/core/features/billing/stripe";
import { fulfillCheckoutSession } from "@/core/features/billing/webhookHelpers";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import {
  makeStripeCheckoutSession,
  makeUser,
} from "@/core/test-utils/factories";
import { asStripeClient } from "@/core/test-utils/mocks/stripe";

import { GET } from "./route";

const mockGetCurrentUser = jest.mocked(getCurrentUser);
const mockGetStripe = jest.mocked(getStripe);
const mockGetStripeBaseUrl = jest.mocked(getStripeBaseUrl);
const mockIsStripeConfigured = jest.mocked(isStripeConfigured);
const mockFulfillCheckoutSession = jest.mocked(fulfillCheckoutSession);

const retrieveCheckoutSession = jest.fn<
  Promise<Stripe.Checkout.Session>,
  [string]
>();

const mockStripe = {
  checkout: {
    sessions: {
      retrieve: retrieveCheckoutSession,
    },
  },
};

function buildRequest(sessionId: string | null): NextRequest {
  const url =
    sessionId == null
      ? "http://localhost:3000/api/stripe/checkout-return"
      : `http://localhost:3000/api/stripe/checkout-return?session_id=${encodeURIComponent(sessionId)}`;

  return new NextRequest(url, { method: "GET" });
}

function expectRedirect(response: Response, location: string): void {
  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toBe(location);
}

describe("GET /api/stripe/checkout-return", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    retrieveCheckoutSession.mockReset();

    mockGetStripeBaseUrl.mockReturnValue("https://app.test");
    mockIsStripeConfigured.mockReturnValue(true);
    mockGetStripe.mockReturnValue(asStripeClient(mockStripe));
    mockGetCurrentUser.mockResolvedValue(makeUser({ id: TEST_USER_ID }));
    mockFulfillCheckoutSession.mockResolvedValue(true);

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("redirects with invalid_session when session_id is missing", async () => {
    const response = await GET(buildRequest(null));

    expectRedirect(
      response,
      "https://app.test/app/upgrade?error=invalid_session",
    );
    expect(mockGetCurrentUser).not.toHaveBeenCalled();
  });

  it("redirects with unauthorized when no user is signed in", async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);

    const response = await GET(buildRequest("cs_test_1"));

    expectRedirect(response, "https://app.test/app/upgrade?error=unauthorized");
    expect(retrieveCheckoutSession).not.toHaveBeenCalled();
  });

  it("redirects when Stripe is not configured", async () => {
    mockIsStripeConfigured.mockReturnValueOnce(false);

    const response = await GET(buildRequest("cs_test_1"));

    expectRedirect(
      response,
      "https://app.test/app/upgrade?error=stripe_not_configured",
    );
  });

  it("redirects when Stripe client is unavailable", async () => {
    mockGetStripe.mockReturnValueOnce(null);

    const response = await GET(buildRequest("cs_test_1"));

    expectRedirect(
      response,
      "https://app.test/app/upgrade?error=stripe_not_configured",
    );
  });

  it("fulfills a paid session and redirects to the upgrade success URL", async () => {
    const session = makeStripeCheckoutSession({
      id: "cs_test_ok",
      userId: TEST_USER_ID,
    });
    retrieveCheckoutSession.mockResolvedValueOnce(session);

    const response = await GET(buildRequest("cs_test_ok"));

    expect(retrieveCheckoutSession).toHaveBeenCalledWith("cs_test_ok");
    expect(mockFulfillCheckoutSession).toHaveBeenCalledWith(session);
    expectRedirect(
      response,
      "https://app.test/app/upgrade?success=true&session_id=cs_test_ok",
    );
  });

  it("rejects a session owned by another user", async () => {
    retrieveCheckoutSession.mockResolvedValueOnce(
      makeStripeCheckoutSession({
        id: "cs_test_other",
        userId: "user-other",
      }),
    );

    const response = await GET(buildRequest("cs_test_other"));

    expect(mockFulfillCheckoutSession).not.toHaveBeenCalled();
    expectRedirect(
      response,
      "https://app.test/app/upgrade?error=invalid_session",
    );
  });

  it("rejects an unpaid session", async () => {
    retrieveCheckoutSession.mockResolvedValueOnce(
      makeStripeCheckoutSession({
        id: "cs_test_unpaid",
        userId: TEST_USER_ID,
        paymentStatus: "unpaid",
      }),
    );

    const response = await GET(buildRequest("cs_test_unpaid"));

    expect(mockFulfillCheckoutSession).not.toHaveBeenCalled();
    expectRedirect(
      response,
      "https://app.test/app/upgrade?error=invalid_session",
    );
  });

  it("redirects with fulfillment_failed when fulfill returns false", async () => {
    retrieveCheckoutSession.mockResolvedValueOnce(
      makeStripeCheckoutSession({
        id: "cs_test_nofulfill",
        userId: TEST_USER_ID,
      }),
    );
    mockFulfillCheckoutSession.mockResolvedValueOnce(false);

    const response = await GET(buildRequest("cs_test_nofulfill"));

    expectRedirect(
      response,
      "https://app.test/app/upgrade?error=fulfillment_failed",
    );
  });

  it("redirects with fulfillment_failed when fulfill throws", async () => {
    retrieveCheckoutSession.mockResolvedValueOnce(
      makeStripeCheckoutSession({
        id: "cs_test_throw",
        userId: TEST_USER_ID,
      }),
    );
    mockFulfillCheckoutSession.mockRejectedValueOnce(new Error("db down"));

    const response = await GET(buildRequest("cs_test_throw"));

    expectRedirect(
      response,
      "https://app.test/app/upgrade?error=fulfillment_failed",
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("uses request origin when getStripeBaseUrl returns null", async () => {
    mockGetStripeBaseUrl.mockReturnValueOnce(null);
    retrieveCheckoutSession.mockResolvedValueOnce(
      makeStripeCheckoutSession({
        id: "cs_test_origin",
        userId: TEST_USER_ID,
      }),
    );

    const response = await GET(buildRequest("cs_test_origin"));

    expectRedirect(
      response,
      "http://localhost:3000/app/upgrade?success=true&session_id=cs_test_origin",
    );
  });
});
