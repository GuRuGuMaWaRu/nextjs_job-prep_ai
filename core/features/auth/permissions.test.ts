jest.mock("@/core/features/auth/actions", () => ({
  getCurrentUserAction: jest.fn(),
}));

jest.mock("@/core/features/users/actions", () => ({
  getUserAction: jest.fn(),
}));

jest.mock("@/core/features/interviews/db", () => ({
  getInterviewCountDb: jest.fn(),
}));
jest.mock("@/core/features/questions/db", () => ({
  getQuestionCountDb: jest.fn(),
}));
jest.mock("@/core/features/resumeAnalysis/db", () => ({
  getResumeAnalysisCountDb: jest.fn(),
}));

import { getCurrentUserAction } from "@/core/features/auth/actions";
import {
  PLAN_LIMITS,
  getUserPlan,
  getUserSubscriptionInfo,
  hasPermission,
  PERMISSIONS,
} from "@/core/features/auth/permissions";
import { getUserAction } from "@/core/features/users/actions";
import { getInterviewCountDb } from "@/core/features/interviews/db";
import { getQuestionCountDb } from "@/core/features/questions/db";
import { getResumeAnalysisCountDb } from "@/core/features/resumeAnalysis/db";

import {
  makeCurrentUser,
  makeProUser,
  makeUser,
} from "@/core/test-utils/factories/user";
import { TEST_USER_ID } from "@/core/test-utils/constants";

const mockGetCurrentUser = jest.mocked(getCurrentUserAction);
const mockGetUserAction = jest.mocked(getUserAction);
const mockGetInterviewCountDb = jest.mocked(getInterviewCountDb);
const mockGetQuestionCountDb = jest.mocked(getQuestionCountDb);
const mockGetResumeAnalysisCountDb = jest.mocked(getResumeAnalysisCountDb);

const SIGNED_IN_USER_ID = TEST_USER_ID;

describe("auth permission helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue(
      makeCurrentUser({ userId: SIGNED_IN_USER_ID }),
    );
  });

  it("exposes free plan limits used by feature permission checks", () => {
    expect(PLAN_LIMITS.free).toEqual({
      interviews: 1,
      questions: 10,
      resume_analyses: 3,
    });
  });

  it("exposes pro plan limits used by feature permission checks", () => {
    expect(PLAN_LIMITS.pro).toEqual({
      interviews: null,
      questions: null,
      resume_analyses: null,
    });
  });

  it("denies permissions when there is no signed-in user", async () => {
    mockGetCurrentUser.mockResolvedValueOnce(makeCurrentUser({ userId: null }));

    await expect(hasPermission(PERMISSIONS.QUESTIONS)).resolves.toBe(false);

    expect(mockGetUserAction).not.toHaveBeenCalled();
  });

  it("denies permissions when the signed-in user cannot be loaded", async () => {
    mockGetUserAction.mockResolvedValue(null);

    await expect(hasPermission(PERMISSIONS.QUESTIONS)).resolves.toBe(false);
  });

  it("grants free-plan permissions", async () => {
    mockGetUserAction.mockResolvedValue(makeUser({ plan: "free" }));
    mockGetInterviewCountDb.mockResolvedValueOnce(0);
    mockGetQuestionCountDb.mockResolvedValueOnce(0);
    mockGetResumeAnalysisCountDb.mockResolvedValueOnce(0);

    await expect(hasPermission(PERMISSIONS.INTERVIEWS)).resolves.toBe(true);
    await expect(hasPermission(PERMISSIONS.QUESTIONS)).resolves.toBe(true);
    await expect(hasPermission(PERMISSIONS.RESUME_ANALYSES)).resolves.toBe(
      true,
    );
  });

  it("denies free-plan permissions when plan limits are reached", async () => {
    mockGetUserAction.mockResolvedValue(makeUser({ plan: "free" }));
    mockGetInterviewCountDb.mockResolvedValueOnce(1);
    mockGetQuestionCountDb.mockResolvedValueOnce(10);
    mockGetResumeAnalysisCountDb.mockResolvedValueOnce(3);

    await expect(hasPermission(PERMISSIONS.INTERVIEWS)).resolves.toBe(false);
    await expect(hasPermission(PERMISSIONS.QUESTIONS)).resolves.toBe(false);
    await expect(hasPermission(PERMISSIONS.RESUME_ANALYSES)).resolves.toBe(
      false,
    );
  });

  it.each([
    {
      permission: PERMISSIONS.INTERVIEWS,
      countLookup: mockGetInterviewCountDb,
    },
    { permission: PERMISSIONS.QUESTIONS, countLookup: mockGetQuestionCountDb },
    {
      permission: PERMISSIONS.RESUME_ANALYSES,
      countLookup: mockGetResumeAnalysisCountDb,
    },
  ])(
    "passes free-plan userId to count lookup for $permission permission",
    async ({ permission, countLookup }) => {
      mockGetUserAction.mockResolvedValue(makeUser({ plan: "free" }));
      countLookup.mockResolvedValueOnce(0);

      await hasPermission(permission);

      expect(countLookup).toHaveBeenCalledWith(SIGNED_IN_USER_ID);
    },
  );

  it("treats an empty stored plan as the free plan for permission checks", async () => {
    mockGetUserAction.mockResolvedValue(makeUser({ plan: "" }));
    mockGetInterviewCountDb.mockResolvedValueOnce(0);
    mockGetQuestionCountDb.mockResolvedValueOnce(0);
    mockGetResumeAnalysisCountDb.mockResolvedValueOnce(0);

    await expect(hasPermission(PERMISSIONS.INTERVIEWS)).resolves.toBe(true);
    await expect(hasPermission(PERMISSIONS.QUESTIONS)).resolves.toBe(true);
    await expect(hasPermission(PERMISSIONS.RESUME_ANALYSES)).resolves.toBe(
      true,
    );
  });

  it("grants permissions for pro users", async () => {
    mockGetUserAction.mockResolvedValue(makeProUser());

    await expect(hasPermission(PERMISSIONS.INTERVIEWS)).resolves.toBe(true);
    await expect(hasPermission(PERMISSIONS.QUESTIONS)).resolves.toBe(true);
    await expect(hasPermission(PERMISSIONS.RESUME_ANALYSES)).resolves.toBe(
      true,
    );

    expect(mockGetInterviewCountDb).not.toHaveBeenCalled();
    expect(mockGetQuestionCountDb).not.toHaveBeenCalled();
    expect(mockGetResumeAnalysisCountDb).not.toHaveBeenCalled();
  });

  it("rejects when count lookup throws", async () => {
    mockGetUserAction.mockResolvedValue(makeUser({ plan: "free" }));
    mockGetInterviewCountDb.mockRejectedValue(new Error("Boom!"));

    await expect(hasPermission(PERMISSIONS.INTERVIEWS)).rejects.toThrow(
      "Boom!",
    );
  });

  it("defaults missing user records to the free plan", async () => {
    mockGetUserAction.mockResolvedValue(null);

    await expect(getUserPlan()).resolves.toBe("free");
  });

  it("defaults anonymous users to the free plan without loading a user", async () => {
    mockGetCurrentUser.mockResolvedValue(makeCurrentUser({ userId: null }));

    await expect(getUserPlan()).resolves.toBe("free");
    expect(mockGetUserAction).not.toHaveBeenCalled();
  });

  it("returns subscription info for anonymous users without loading a user", async () => {
    mockGetCurrentUser.mockResolvedValue(makeCurrentUser({ userId: null }));

    await expect(getUserSubscriptionInfo()).resolves.toEqual({
      plan: "free",
      hasExistingSubscription: false,
    });
    expect(mockGetUserAction).not.toHaveBeenCalled();
  });

  it("defaults missing plan and subscription fields in subscription info", async () => {
    mockGetUserAction.mockResolvedValue(makeUser({ plan: "" }));

    await expect(getUserSubscriptionInfo()).resolves.toEqual({
      plan: "free",
      hasExistingSubscription: false,
    });
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

  it("denies unsupported runtime permissions", async () => {
    mockGetUserAction.mockResolvedValue(makeProUser());
    // Simulates an untyped caller crossing the module boundary.
    const unsupportedPermission = "unsupported" as Parameters<
      typeof hasPermission
    >[0];
    await expect(hasPermission(unsupportedPermission)).resolves.toBe(false);
  });
});
