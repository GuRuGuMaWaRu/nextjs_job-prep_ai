jest.mock("@/core/features/billing/stripe", () => ({
  getStripe: jest.fn(),
}));

jest.mock("@/core/drizzle/db", () => ({
  db: {},
}));

jest.mock("@/core/features/users/db", () => ({
  updateUserPlanAndStripeIdsDb: jest.fn(),
}));

import type Stripe from "stripe";

import { getStripe } from "@/core/features/billing/stripe";
import { updateUserPlanAndStripeIdsDb } from "@/core/features/users/db";
import {
  makeStripeCheckoutSession,
  makeStripeSubscription,
} from "@/core/test-utils/factories";

import { fulfillCheckoutSession } from "./webhookHelpers";

const retrieveSubscription = jest.fn<
  Promise<Stripe.Subscription>,
  [string]
>();

const stripe = {
  subscriptions: {
    retrieve: retrieveSubscription,
  },
} as unknown as Stripe;

const mockGetStripe = jest.mocked(getStripe);
const mockUpdateUserPlanAndStripeIdsDb = jest.mocked(
  updateUserPlanAndStripeIdsDb,
);

describe("fulfillCheckoutSession", () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetStripe.mockReturnValue(stripe);
    mockUpdateUserPlanAndStripeIdsDb.mockResolvedValue(undefined);
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it("updates the user for a paid checkout session with an active subscription", async () => {
    const session = makeStripeCheckoutSession({
      userId: "user-test",
      customerId: "cus_test_active",
      subscriptionId: "sub_test_active",
    });
    retrieveSubscription.mockResolvedValueOnce(
      makeStripeSubscription({
        id: "sub_test_active",
        customer: "cus_test_active",
        status: "active",
      }),
    );

    await expect(fulfillCheckoutSession(session)).resolves.toBe(true);

    expect(retrieveSubscription).toHaveBeenCalledWith("sub_test_active");
    expect(mockUpdateUserPlanAndStripeIdsDb).toHaveBeenCalledWith("user-test", {
      plan: "pro",
      stripeCustomerId: "cus_test_active",
      stripeSubscriptionId: "sub_test_active",
    });
  });

  it("does not re-grant Pro when an old paid checkout success points at a canceled subscription", async () => {
    const session = makeStripeCheckoutSession({
      userId: "user-test",
      customerId: "cus_test_canceled",
      subscriptionId: "sub_test_canceled",
    });
    retrieveSubscription.mockResolvedValueOnce(
      makeStripeSubscription({
        id: "sub_test_canceled",
        customer: "cus_test_canceled",
        status: "canceled",
      }),
    );

    await expect(fulfillCheckoutSession(session)).resolves.toBe(false);

    expect(retrieveSubscription).toHaveBeenCalledWith("sub_test_canceled");
    expect(mockUpdateUserPlanAndStripeIdsDb).not.toHaveBeenCalled();
  });
});
