jest.mock("@/core/features/auth/actions", () => ({
  getCurrentUserAction: jest.fn(),
}));

jest.mock("@/core/features/users/actions", () => ({
  getUserAction: jest.fn(),
}));

import { getCurrentUserAction } from "@/core/features/auth/actions";
import {
  FREE_PLAN_LIMITS,
  getUserPlan,
  getUserSubscriptionInfo,
  hasPermission,
  hasUnlimitedAccess,
  PERMISSIONS,
} from "@/core/features/auth/permissions";
import { getUserAction } from "@/core/features/users/actions";
import {
  makeCurrentUser,
  makeProUser,
  makeUser,
} from "@/core/test-utils/factories/user";
import { TEST_USER_ID } from "@/core/test-utils/constants";

const mockGetCurrentUser = jest.mocked(getCurrentUserAction);
const mockGetUserAction = jest.mocked(getUserAction);

const SIGNED_IN_USER_ID = TEST_USER_ID;

describe("auth permission helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue(
      makeCurrentUser({ userId: SIGNED_IN_USER_ID }),
    );
  });

  it("exposes free plan limits used by feature permission checks", () => {
    expect(FREE_PLAN_LIMITS).toEqual({
      interviews: 1,
      questions: 10,
      resume_analyses: 3,
    });
  });

  it("denies permissions when there is no signed-in user", async () => {
    mockGetCurrentUser.mockResolvedValue(makeCurrentUser({ userId: null }));

    await expect(hasPermission(PERMISSIONS.LIMITED.QUESTIONS)).resolves.toBe(
      false,
    );

    expect(mockGetUserAction).not.toHaveBeenCalled();
  });

  it("denies permissions when the signed-in user cannot be loaded", async () => {
    mockGetUserAction.mockResolvedValue(null);

    await expect(hasPermission(PERMISSIONS.LIMITED.QUESTIONS)).resolves.toBe(
      false,
    );
  });

  it("grants limited free-plan permissions and denies pro-only permissions", async () => {
    mockGetUserAction.mockResolvedValue(makeUser({ plan: "free" }));

    await expect(hasPermission(PERMISSIONS.LIMITED.QUESTIONS)).resolves.toBe(
      true,
    );
    await expect(hasPermission(PERMISSIONS.UNLIMITED.QUESTIONS)).resolves.toBe(
      false,
    );
  });

  it("grants unlimited permissions for pro users", async () => {
    mockGetUserAction.mockResolvedValue(makeProUser());

    await expect(hasPermission(PERMISSIONS.UNLIMITED.INTERVIEWS)).resolves.toBe(
      true,
    );
    await expect(hasUnlimitedAccess("questions")).resolves.toBe(true);
  });

  it("defaults missing user records to the free plan", async () => {
    mockGetUserAction.mockResolvedValue(null);

    await expect(getUserPlan()).resolves.toBe("free");
  });

  it("returns subscription info for anonymous users without loading a user", async () => {
    mockGetCurrentUser.mockResolvedValue(makeCurrentUser({ userId: null }));

    await expect(getUserSubscriptionInfo()).resolves.toEqual({
      plan: "free",
      hasExistingSubscription: false,
    });
    expect(mockGetUserAction).not.toHaveBeenCalled();
  });

  it("reports the current plan and whether a Stripe subscription exists", async () => {
    mockGetUserAction.mockResolvedValue(
      makeProUser({ stripeSubscriptionId: "sub_test_1" }),
    );

    await expect(getUserSubscriptionInfo()).resolves.toEqual({
      plan: "pro",
      hasExistingSubscription: true,
    });
  });
});
