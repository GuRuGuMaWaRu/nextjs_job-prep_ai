jest.mock("@/core/features/auth/permissions", () => ({
  PLAN_LIMITS: {
    free: {
      interviews: 1,
      questions: 10,
      resume_analyses: 3,
    },
    pro: {
      interviews: null,
      questions: null,
      resume_analyses: null,
    },
  },
  PERMISSIONS: {
    INTERVIEWS: "interviews",
    QUESTIONS: "questions",
    RESUME_ANALYSES: "resume_analyses",
  },
  hasPermission: jest.fn(),
}));

jest.mock("@/core/features/resumeAnalysis/db", () => ({
  tryInsertResumeAnalysisDb: jest.fn(),
}));

jest.mock("@/core/features/users/actions", () => ({
  getUserAction: jest.fn(),
}));

import {
  PLAN_LIMITS,
  hasPermission,
  PERMISSIONS,
} from "@/core/features/auth/permissions";
import { tryInsertResumeAnalysisDb } from "@/core/features/resumeAnalysis/db";
import { getUserAction } from "@/core/features/users/actions";
import { DatabaseError } from "@/core/dal/errors";

import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeProUser, makeUser } from "@/core/test-utils/factories";

import {
  checkResumeAnalysisPermission,
  reserveResumeAnalysisUsage,
} from "./permissions";

const mockHasPermission = jest.mocked(hasPermission);
const mockGetUserAction = jest.mocked(getUserAction);
const mockTryInsertResumeAnalysisDb = jest.mocked(tryInsertResumeAnalysisDb);

const SIGNED_IN_USER_ID = TEST_USER_ID;

describe("checkResumeAnalysisPermission", () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("passes correct permission to hasPermission", async () => {
    mockHasPermission.mockResolvedValueOnce(true);

    await checkResumeAnalysisPermission();

    expect(mockHasPermission).toHaveBeenCalledWith(PERMISSIONS.RESUME_ANALYSES);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("returns true when hasPermission resolves true", async () => {
    mockHasPermission.mockResolvedValueOnce(true);

    await expect(checkResumeAnalysisPermission()).resolves.toBe(true);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("returns false when hasPermission resolves false", async () => {
    mockHasPermission.mockResolvedValueOnce(false);

    await expect(checkResumeAnalysisPermission()).resolves.toBe(false);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("throws DatabaseError when hasPermission rejects", async () => {
    const error = new Error("permission failed");

    mockHasPermission.mockRejectedValue(error);

    await expect(checkResumeAnalysisPermission()).rejects.toThrow(
      new DatabaseError("Error checking resume analysis permission", error),
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error checking resume analysis permission:",
      expect.any(Error),
    );
  });
});

describe("reserveResumeAnalysisUsage", () => {
  const jobInfoId = "00000000-0000-4000-8000-000000000401";

  beforeEach(() => {
    jest.clearAllMocks();
    mockHasPermission.mockResolvedValue(true);
    mockGetUserAction.mockResolvedValue(makeUser({ plan: "free" }));
  });

  it("returns false when the user lacks permissions", async () => {
    mockHasPermission.mockResolvedValueOnce(false);
    await expect(
      reserveResumeAnalysisUsage(SIGNED_IN_USER_ID, jobInfoId),
    ).resolves.toBe(false);

    expect(mockGetUserAction).not.toHaveBeenCalled();
    expect(mockTryInsertResumeAnalysisDb).not.toHaveBeenCalled();
  });

  it("returns false when the signed-in user cannot be loaded", async () => {
    mockHasPermission.mockResolvedValueOnce(true);
    mockGetUserAction.mockResolvedValueOnce(null);

    await expect(
      reserveResumeAnalysisUsage(SIGNED_IN_USER_ID, jobInfoId),
    ).resolves.toBe(false);

    expect(mockTryInsertResumeAnalysisDb).not.toHaveBeenCalled();
  });

  it("returns true when a free user successfully reserves quota", async () => {
    mockHasPermission.mockResolvedValueOnce(true);
    mockTryInsertResumeAnalysisDb.mockResolvedValue({ id: "analysis-id" });

    await expect(
      reserveResumeAnalysisUsage(SIGNED_IN_USER_ID, jobInfoId),
    ).resolves.toBe(true);

    expect(mockTryInsertResumeAnalysisDb).toHaveBeenCalledWith({
      userId: SIGNED_IN_USER_ID,
      jobInfoId,
      limit: PLAN_LIMITS.free.resume_analyses,
    });
  });

  it("returns true when a pro user successfully reserves quota", async () => {
    mockHasPermission.mockResolvedValueOnce(true);
    mockGetUserAction.mockResolvedValueOnce(makeProUser());
    mockTryInsertResumeAnalysisDb.mockResolvedValue({ id: "analysis-id" });

    await expect(
      reserveResumeAnalysisUsage(SIGNED_IN_USER_ID, jobInfoId),
    ).resolves.toBe(true);

    expect(mockTryInsertResumeAnalysisDb).toHaveBeenCalledWith({
      userId: SIGNED_IN_USER_ID,
      jobInfoId,
      limit: PLAN_LIMITS.pro.resume_analyses,
    });
  });

  it("returns false when a user is at the quota limit", async () => {
    mockHasPermission.mockResolvedValueOnce(true);
    mockTryInsertResumeAnalysisDb.mockResolvedValue(null);

    await expect(
      reserveResumeAnalysisUsage(SIGNED_IN_USER_ID, jobInfoId),
    ).resolves.toBe(false);
  });

  it("propagates unexpected reservation failures", async () => {
    mockHasPermission.mockResolvedValueOnce(true);
    mockTryInsertResumeAnalysisDb.mockRejectedValue(
      new DatabaseError("Reservation failed"),
    );

    await expect(
      reserveResumeAnalysisUsage(SIGNED_IN_USER_ID, jobInfoId),
    ).rejects.toThrow(DatabaseError);
  });
});
