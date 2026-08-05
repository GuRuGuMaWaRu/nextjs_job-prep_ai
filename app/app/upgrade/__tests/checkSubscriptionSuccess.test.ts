jest.mock("@/core/lib/getCurrentUser", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("@/core/features/billing/stripe", () => ({
  getStripe: jest.fn(),
}));

import type Stripe from "stripe";

import { getCurrentUser } from "@/core/lib/getCurrentUser";
import { getStripe } from "@/core/features/billing/stripe";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import {
  makeStripeCheckoutSession,
  makeUser,
} from "@/core/test-utils/factories";

import { checkSubscriptionSuccess } from "../checkSubscriptionSuccess";

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

const mockGetCurrentUser = jest.mocked(getCurrentUser);
const mockGetStripe = jest.mocked(getStripe);

describe("checkSubscriptionSuccess", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetStripe.mockReturnValue(stripe);
    mockGetCurrentUser.mockResolvedValue(makeUser({ id: TEST_USER_ID }));
  });

  it("returns false without checking Stripe when success is not present", async () => {
    await expect(checkSubscriptionSuccess({})).resolves.toBe(false);

    expect(mockGetStripe).not.toHaveBeenCalled();
    expect(retrieveCheckoutSession).not.toHaveBeenCalled();
  });

  it("returns false without checking the user when success has no session id", async () => {
    await expect(
      checkSubscriptionSuccess({
        success: "true",
      }),
    ).resolves.toBe(false);

    await expect(
      checkSubscriptionSuccess({
        success: "true",
        session_id: ["cs_test_array"],
      }),
    ).resolves.toBe(false);

    expect(mockGetStripe).toHaveBeenCalledTimes(2);
    expect(mockGetCurrentUser).not.toHaveBeenCalled();
    expect(retrieveCheckoutSession).not.toHaveBeenCalled();
  });

  it("returns false without checking the user when Stripe is unavailable", async () => {
    mockGetStripe.mockReturnValueOnce(null);

    await expect(
      checkSubscriptionSuccess({
        success: "true",
        session_id: "cs_test_success",
      }),
    ).resolves.toBe(false);

    expect(mockGetCurrentUser).not.toHaveBeenCalled();
    expect(retrieveCheckoutSession).not.toHaveBeenCalled();
  });

  it("returns true for a paid Checkout session owned by the current user", async () => {
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
  });

  it("returns false for a paid Checkout session owned by another user", async () => {
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
  });

  it("returns false for an unpaid Checkout session owned by the current user", async () => {
    const session = makeStripeCheckoutSession({
      id: "cs_test_unpaid",
      userId: TEST_USER_ID,
      paymentStatus: "unpaid",
    });
    retrieveCheckoutSession.mockResolvedValueOnce(session);

    await expect(
      checkSubscriptionSuccess({
        success: "true",
        session_id: "cs_test_unpaid",
      }),
    ).resolves.toBe(false);
  });

  it("returns false when Stripe retrieve fails", async () => {
    retrieveCheckoutSession.mockRejectedValueOnce(new Error("stripe down"));

    await expect(
      checkSubscriptionSuccess({
        success: "true",
        session_id: "cs_test_db_down",
      }),
    ).resolves.toBe(false);
  });

  it("returns false when no user is signed in", async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);

    await expect(
      checkSubscriptionSuccess({
        success: "true",
        session_id: "cs_test_success",
      }),
    ).resolves.toBe(false);

    expect(retrieveCheckoutSession).not.toHaveBeenCalled();
  });
});
