jest.mock("@/core/features/auth/actions", () => ({
  getCurrentUserAction: jest.fn(),
}));

jest.mock("@/core/features/users/db", () => ({
  getUserByIdDb: jest.fn(),
}));

jest.mock("@/core/features/users/stripeSync", () => ({
  reconcileUserStripeSubscription: jest.fn(),
}));

jest.mock("@/core/features/billing/stripe", () => ({
  getStripe: jest.fn(),
  isStripeConfigured: jest.fn(),
}));

import { getCurrentUserAction } from "@/core/features/auth/actions";
import { getStripe, isStripeConfigured } from "@/core/features/billing/stripe";
import { getUserByIdDb } from "@/core/features/users/db";
import { reconcileUserStripeSubscription } from "@/core/features/users/stripeSync";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeCurrentUser, makeUser } from "@/core/test-utils/factories";

import { syncSubscriptionOnUpgradePageLoad } from "./syncSubscriptionOnLoad";

const mockGetCurrentUser = jest.mocked(getCurrentUserAction);
const mockGetStripe = jest.mocked(getStripe);
const mockIsStripeConfigured = jest.mocked(isStripeConfigured);
const mockGetUserByIdDb = jest.mocked(getUserByIdDb);
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
      makeCurrentUser({ userId: TEST_USER_ID }),
    );
    mockGetUserByIdDb.mockResolvedValue(
      makeUser({
        id: TEST_USER_ID,
        stripeSubscriptionId: "sub_test_1",
      }),
    );
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("reconciles the current user's subscription when present", async () => {
    await expect(syncSubscriptionOnUpgradePageLoad()).resolves.toBeUndefined();

    expect(mockReconcileUserStripeSubscription).toHaveBeenCalledWith(
      stripe,
      TEST_USER_ID,
    );
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("swallows current user lookup failures so the page can render", async () => {
    const error = new Error("session failed");
    mockGetCurrentUser.mockRejectedValue(error);

    await expect(syncSubscriptionOnUpgradePageLoad()).resolves.toBeUndefined();

    expect(mockGetUserByIdDb).not.toHaveBeenCalled();
    expect(mockReconcileUserStripeSubscription).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error syncing subscription:",
      error,
    );
  });

  it("swallows direct user lookup failures so the page can render", async () => {
    const error = new Error("database failed");
    mockGetUserByIdDb.mockRejectedValue(error);

    await expect(syncSubscriptionOnUpgradePageLoad()).resolves.toBeUndefined();

    expect(mockReconcileUserStripeSubscription).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error syncing subscription:",
      error,
    );
  });
});
