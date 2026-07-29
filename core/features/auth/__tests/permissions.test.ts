jest.mock("@/core/lib/getCurrentUser", () => ({
  getCurrentUser: jest.fn(),
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

import { getCurrentUser } from "@/core/lib/getCurrentUser";
import {
  getUserPlan,
  getUserSubscriptionInfo,
  hasPermission,
} from "@/core/features/auth/permissions";
import { PLAN_LIMITS, PERMISSIONS } from "@/core/data/constants";
import { getInterviewCountDb } from "@/core/features/interviews/db";
import { getQuestionCountDb } from "@/core/features/questions/db";
import { getResumeAnalysisCountDb } from "@/core/features/resumeAnalysis/db";

import { makeProUser, makeUser } from "@/core/test-utils/factories/user";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { DatabaseError } from "@/core/lib/errors";

const mockGetCurrentUser = jest.mocked(getCurrentUser);
const mockGetInterviewCountDb = jest.mocked(getInterviewCountDb);
const mockGetQuestionCountDb = jest.mocked(getQuestionCountDb);
const mockGetResumeAnalysisCountDb = jest.mocked(getResumeAnalysisCountDb);

const SIGNED_IN_USER_ID = TEST_USER_ID;

describe("auth permission helpers", () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue(makeUser({ id: SIGNED_IN_USER_ID }));
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("PLAN_LIMITS", () => {
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
  });

  describe("hasPermission", () => {
    it("denies permissions when the signed-in user cannot be loaded", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      await expect(hasPermission(PERMISSIONS.QUESTIONS)).resolves.toBe(false);
    });

    it("grants free-plan permissions", async () => {
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
      {
        permission: PERMISSIONS.QUESTIONS,
        countLookup: mockGetQuestionCountDb,
      },
      {
        permission: PERMISSIONS.RESUME_ANALYSES,
        countLookup: mockGetResumeAnalysisCountDb,
      },
    ])("passes free-plan userId to count lookup for $permission permission", async ({
      permission,
      countLookup,
    }) => {
      countLookup.mockResolvedValueOnce(0);

      await hasPermission(permission);

      expect(countLookup).toHaveBeenCalledWith(SIGNED_IN_USER_ID);
    });

    it("grants permissions for pro users", async () => {
      mockGetCurrentUser.mockResolvedValue(makeProUser());

      await expect(hasPermission(PERMISSIONS.INTERVIEWS)).resolves.toBe(true);
      await expect(hasPermission(PERMISSIONS.QUESTIONS)).resolves.toBe(true);
      await expect(hasPermission(PERMISSIONS.RESUME_ANALYSES)).resolves.toBe(
        true,
      );
    });

    it("rejects when count lookup throws", async () => {
      const randomError = new Error("Boom!");

      mockGetInterviewCountDb.mockRejectedValueOnce(randomError);

      await expect(hasPermission(PERMISSIONS.INTERVIEWS)).rejects.toThrow(
        DatabaseError,
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error getting count",
        randomError,
      );
    });

    it("denies unsupported runtime permissions", async () => {
      mockGetCurrentUser.mockResolvedValue(makeProUser());
      // Simulates an untyped caller crossing the module boundary.
      const unsupportedPermission = "unsupported" as Parameters<
        typeof hasPermission
      >[0];
      await expect(hasPermission(unsupportedPermission)).resolves.toBe(false);
    });
  });

  describe("getUserPlan", () => {
    it("defaults missing user records to the free plan", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      await expect(getUserPlan()).resolves.toBe("free");
    });

    it("returns the user's plan", async () => {
      mockGetCurrentUser.mockResolvedValue(makeProUser());

      await expect(getUserPlan()).resolves.toBe("pro");
    });
  });

  describe("getUserSubscriptionInfo", () => {
    it("returns subscription info for anonymous users without loading a user", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      await expect(getUserSubscriptionInfo()).resolves.toEqual({
        plan: "free",
        hasExistingSubscription: false,
      });
    });

    it("reports the current plan and whether a Stripe subscription exists", async () => {
      mockGetCurrentUser.mockResolvedValue(
        makeProUser({ stripeSubscriptionId: "sub_test_1" }),
      );

      await expect(getUserSubscriptionInfo()).resolves.toEqual({
        plan: "pro",
        hasExistingSubscription: true,
      });
    });
  });
});
