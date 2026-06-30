jest.mock("@/core/features/auth/actions", () => ({
  getCurrentUserAction: jest.fn(),
}));

jest.mock("@/core/features/auth/permissions", () => ({
  FREE_PLAN_LIMITS: {
    interviews: 1,
    questions: 10,
    resume_analyses: 3,
  },
  PERMISSIONS: {
    UNLIMITED: {
      INTERVIEWS: "unlimited_interviews",
      QUESTIONS: "unlimited_questions",
      RESUME_ANALYSES: "unlimited_resume_analyses",
    },
    LIMITED: {
      INTERVIEWS: "limited_interviews",
      QUESTIONS: "limited_questions",
      RESUME_ANALYSES: "limited_resume_analyses",
    },
  },
  hasPermission: jest.fn(),
}));

jest.mock("@/core/features/resumeAnalysis/db", () => ({
  getResumeAnalysisCountDb: jest.fn(),
}));

import { getCurrentUserAction } from "@/core/features/auth/actions";
import {
  FREE_PLAN_LIMITS,
  hasPermission,
  PERMISSIONS,
} from "@/core/features/auth/permissions";
import { getResumeAnalysisCountDb } from "@/core/features/resumeAnalysis/db";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeCurrentUser } from "@/core/test-utils/factories/user";

import { checkResumeAnalysisPermission } from "./permissions";

const mockGetCurrentUser = jest.mocked(getCurrentUserAction);
const mockHasPermission = jest.mocked(hasPermission);
const mockGetResumeAnalysisCountDb = jest.mocked(getResumeAnalysisCountDb);

const SIGNED_IN_USER_ID = TEST_USER_ID;

describe("checkResumeAnalysisPermission", () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    mockGetCurrentUser.mockResolvedValue(
      makeCurrentUser({ userId: SIGNED_IN_USER_ID }),
    );
    mockHasPermission.mockResolvedValue(false);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("denies anonymous users without checking plan permissions", async () => {
    mockGetCurrentUser.mockResolvedValue(makeCurrentUser({ userId: null }));

    await expect(checkResumeAnalysisPermission()).resolves.toBe(false);

    expect(mockHasPermission).not.toHaveBeenCalled();
  });

  it("allows users with unlimited resume analysis permission without reading usage", async () => {
    mockHasPermission.mockResolvedValueOnce(true);

    await expect(checkResumeAnalysisPermission()).resolves.toBe(true);

    expect(mockHasPermission).toHaveBeenCalledWith(
      PERMISSIONS.UNLIMITED.RESUME_ANALYSES,
    );
    expect(mockGetResumeAnalysisCountDb).not.toHaveBeenCalled();
  });

  it("denies users without limited or unlimited resume analysis permission", async () => {
    mockHasPermission.mockResolvedValue(false);

    await expect(checkResumeAnalysisPermission()).resolves.toBe(false);

    expect(mockGetResumeAnalysisCountDb).not.toHaveBeenCalled();
  });

  it("allows limited users below the free resume analysis limit", async () => {
    mockHasPermission.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mockGetResumeAnalysisCountDb.mockResolvedValue(
      FREE_PLAN_LIMITS.resume_analyses - 1,
    );

    await expect(checkResumeAnalysisPermission()).resolves.toBe(true);

    expect(mockGetResumeAnalysisCountDb).toHaveBeenCalledWith(
      SIGNED_IN_USER_ID,
    );
  });

  it("denies limited users at the free resume analysis limit", async () => {
    mockHasPermission.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mockGetResumeAnalysisCountDb.mockResolvedValue(
      FREE_PLAN_LIMITS.resume_analyses,
    );

    await expect(checkResumeAnalysisPermission()).resolves.toBe(false);
  });

  it("returns false when the permission check throws", async () => {
    mockHasPermission.mockRejectedValue(new Error("permission failed"));

    await expect(checkResumeAnalysisPermission()).resolves.toBe(false);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error checking resume analysis permission:",
      expect.any(Error),
    );
  });
});
