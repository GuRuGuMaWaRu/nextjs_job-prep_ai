jest.mock("@/core/lib/getCurrentUser", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("@/core/features/users/stripeSync", () => ({
  reconcileUserStripeSubscription: jest.fn(),
}));

jest.mock("@/core/features/billing/stripe", () => ({
  getStripe: jest.fn(),
  isStripeConfigured: jest.fn(),
}));

import { getCurrentUser } from "@/core/lib/getCurrentUser";
import { getStripe, isStripeConfigured } from "@/core/features/billing/stripe";
import { reconcileUserStripeSubscription } from "@/core/features/users/stripeSync";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeUser } from "@/core/test-utils/factories";

import { syncSubscriptionOnUpgradePageLoad } from "../syncSubscriptionOnLoad";

const mockGetCurrentUser = jest.mocked(getCurrentUser);
const mockGetStripe = jest.mocked(getStripe);
const mockIsStripeConfigured = jest.mocked(isStripeConfigured);
const mockReconcileUserStripeSubscription = jest.mocked(
  reconcileUserStripeSubscription,
);

const stripe = {} as ReturnType<typeof getStripe>;

describe("syncSubscriptionOnUpgradePageLoad", () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    mockIsStripeConfigured.mockReturnValue(true);
    mockGetStripe.mockReturnValue(stripe);
    mockGetCurrentUser.mockResolvedValue(
      makeUser({ id: TEST_USER_ID, stripeSubscriptionId: "sub_test_1" }),
    );
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("reconciles the current user's subscription when present", async () => {
    await syncSubscriptionOnUpgradePageLoad();

    expect(mockGetStripe).toHaveBeenCalledTimes(1);
    expect(mockGetCurrentUser).toHaveBeenCalledTimes(1);
    expect(mockReconcileUserStripeSubscription).toHaveBeenCalledWith(
      stripe,
      TEST_USER_ID,
    );
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("skips reconciliation when Stripe is not configured", async () => {
    mockIsStripeConfigured.mockReturnValue(false);

    await expect(syncSubscriptionOnUpgradePageLoad()).resolves.toBeUndefined();

    expect(mockGetStripe).not.toHaveBeenCalled();
    expect(mockGetCurrentUser).not.toHaveBeenCalled();
    expect(mockReconcileUserStripeSubscription).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("skips reconciliation when Stripe is configured but unavailable", async () => {
    mockGetStripe.mockReturnValue(null);

    await expect(syncSubscriptionOnUpgradePageLoad()).resolves.toBeUndefined();

    expect(mockGetCurrentUser).not.toHaveBeenCalled();
    expect(mockReconcileUserStripeSubscription).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("skips reconciliation when no user is signed in", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    await expect(syncSubscriptionOnUpgradePageLoad()).resolves.toBeUndefined();

    expect(mockReconcileUserStripeSubscription).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("skips reconciliation when the user has no Stripe subscription id", async () => {
    mockGetCurrentUser.mockResolvedValue(
      makeUser({ id: TEST_USER_ID, stripeSubscriptionId: null }),
    );

    await expect(syncSubscriptionOnUpgradePageLoad()).resolves.toBeUndefined();

    expect(mockReconcileUserStripeSubscription).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("swallows current user lookup failures so the page can render", async () => {
    const error = new Error("session failed");
    mockGetCurrentUser.mockRejectedValue(error);

    await expect(syncSubscriptionOnUpgradePageLoad()).resolves.toBeUndefined();

    expect(mockReconcileUserStripeSubscription).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error syncing subscription:",
      error,
    );
  });
});
