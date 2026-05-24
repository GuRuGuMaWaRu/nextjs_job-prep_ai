jest.mock("@/core/features/auth/actions", () => ({
  getCurrentUserAction: jest.fn(),
}));

jest.mock("@/core/features/billing/stripe", () => ({
  getStripe: jest.fn(),
}));

jest.mock("@/core/features/billing/webhookHelpers", () => ({
  fulfillCheckoutSession: jest.fn(),
}));

import type Stripe from "stripe";

import { getCurrentUserAction } from "@/core/features/auth/actions";
import { getStripe } from "@/core/features/billing/stripe";
import { fulfillCheckoutSession } from "@/core/features/billing/webhookHelpers";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import {
  makeCurrentUser,
  makeStripeCheckoutSession,
} from "@/core/test-utils/factories";

import { checkSubscriptionSuccess } from "./checkSubscriptionSuccess";

const retrieveCheckoutSession = jest.fn<
  Promise<Stripe.Checkout.Session>,
  [string]
>();

const stripe = {
  checkout: {
    sessions: {
      retrieve: retrieveCheckoutSession,
    },
  },
} as unknown as Stripe;

const mockGetCurrentUser = jest.mocked(getCurrentUserAction);
const mockGetStripe = jest.mocked(getStripe);
const mockFulfillCheckoutSession = jest.mocked(fulfillCheckoutSession);

describe("checkSubscriptionSuccess", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetStripe.mockReturnValue(stripe);
    mockGetCurrentUser.mockResolvedValue(
      makeCurrentUser({ userId: TEST_USER_ID }),
    );
    mockFulfillCheckoutSession.mockResolvedValue(true);
  });

  it("returns false without checking Stripe when success is not present", async () => {
    await expect(checkSubscriptionSuccess({})).resolves.toBe(false);

    expect(mockGetStripe).not.toHaveBeenCalled();
    expect(retrieveCheckoutSession).not.toHaveBeenCalled();
    expect(mockFulfillCheckoutSession).not.toHaveBeenCalled();
  });

  it("fulfills a paid Checkout session owned by the current user", async () => {
    const session = makeStripeCheckoutSession({
      id: "cs_test_success",
      userId: TEST_USER_ID,
      customerId: "cus_test_success",
      subscriptionId: "sub_test_success",
    });
    retrieveCheckoutSession.mockResolvedValueOnce(session);

    await expect(
      checkSubscriptionSuccess({
        success: "true",
        session_id: "cs_test_success",
      }),
    ).resolves.toBe(true);

    expect(retrieveCheckoutSession).toHaveBeenCalledWith("cs_test_success");
    expect(mockFulfillCheckoutSession).toHaveBeenCalledWith(session);
  });

  it("does not fulfill a paid Checkout session for another user", async () => {
    const session = makeStripeCheckoutSession({
      id: "cs_test_other_user",
      userId: "user-other",
    });
    retrieveCheckoutSession.mockResolvedValueOnce(session);

    await expect(
      checkSubscriptionSuccess({
        success: "true",
        session_id: "cs_test_other_user",
      }),
    ).resolves.toBe(false);

    expect(mockFulfillCheckoutSession).not.toHaveBeenCalled();
  });

  it("returns false when the fallback fulfillment does not update the user", async () => {
    const session = makeStripeCheckoutSession({
      id: "cs_test_missing_subscription",
      userId: TEST_USER_ID,
      subscriptionId: null,
    });
    retrieveCheckoutSession.mockResolvedValueOnce(session);
    mockFulfillCheckoutSession.mockResolvedValueOnce(false);

    await expect(
      checkSubscriptionSuccess({
        success: "true",
        session_id: "cs_test_missing_subscription",
      }),
    ).resolves.toBe(false);
  });

  it("returns false when fallback fulfillment fails", async () => {
    const session = makeStripeCheckoutSession({
      id: "cs_test_db_down",
      userId: TEST_USER_ID,
    });
    retrieveCheckoutSession.mockResolvedValueOnce(session);
    mockFulfillCheckoutSession.mockRejectedValueOnce(new Error("db down"));

    await expect(
      checkSubscriptionSuccess({
        success: "true",
        session_id: "cs_test_db_down",
      }),
    ).resolves.toBe(false);
  });
});
