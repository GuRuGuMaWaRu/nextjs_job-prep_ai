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
  insertResumeAnalysisDb: jest.fn(),
  tryInsertResumeAnalysisDb: jest.fn(),
}));

import { getCurrentUserAction } from "@/core/features/auth/actions";
import {
  FREE_PLAN_LIMITS,
  hasPermission,
  PERMISSIONS,
} from "@/core/features/auth/permissions";
import {
  getResumeAnalysisCountDb,
  insertResumeAnalysisDb,
  tryInsertResumeAnalysisDb,
} from "@/core/features/resumeAnalysis/db";
import { DatabaseError } from "@/core/dal/errors";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeCurrentUser } from "@/core/test-utils/factories/user";

import {
  checkResumeAnalysisPermission,
  reserveResumeAnalysisUsage,
} from "./permissions";

const mockGetCurrentUser = jest.mocked(getCurrentUserAction);
const mockHasPermission = jest.mocked(hasPermission);
const mockGetResumeAnalysisCountDb = jest.mocked(getResumeAnalysisCountDb);
const mockInsertResumeAnalysisDb = jest.mocked(insertResumeAnalysisDb);
const mockTryInsertResumeAnalysisDb = jest.mocked(tryInsertResumeAnalysisDb);

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

describe("reserveResumeAnalysisUsage", () => {
  const jobInfoId = "00000000-0000-4000-8000-000000000401";

  beforeEach(() => {
    jest.clearAllMocks();
    mockHasPermission.mockResolvedValue(false);
  });

  it("inserts without quota checks for unlimited users", async () => {
    mockHasPermission.mockResolvedValueOnce(true);

    await expect(
      reserveResumeAnalysisUsage(SIGNED_IN_USER_ID, jobInfoId),
    ).resolves.toBe(true);

    expect(mockInsertResumeAnalysisDb).toHaveBeenCalledWith({ jobInfoId });
    expect(mockTryInsertResumeAnalysisDb).not.toHaveBeenCalled();
  });

  it("returns false when the user lacks limited or unlimited permission", async () => {
    mockHasPermission.mockResolvedValue(false);

    await expect(
      reserveResumeAnalysisUsage(SIGNED_IN_USER_ID, jobInfoId),
    ).resolves.toBe(false);

    expect(mockInsertResumeAnalysisDb).not.toHaveBeenCalled();
    expect(mockTryInsertResumeAnalysisDb).not.toHaveBeenCalled();
  });

  it("returns true when a limited user successfully reserves quota", async () => {
    mockHasPermission.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mockTryInsertResumeAnalysisDb.mockResolvedValue({ id: "analysis-id" });

    await expect(
      reserveResumeAnalysisUsage(SIGNED_IN_USER_ID, jobInfoId),
    ).resolves.toBe(true);

    expect(mockTryInsertResumeAnalysisDb).toHaveBeenCalledWith({
      userId: SIGNED_IN_USER_ID,
      jobInfoId,
      limit: FREE_PLAN_LIMITS.resume_analyses,
    });
  });

  it("returns false when a limited user is at the quota limit", async () => {
    mockHasPermission.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mockTryInsertResumeAnalysisDb.mockResolvedValue(null);

    await expect(
      reserveResumeAnalysisUsage(SIGNED_IN_USER_ID, jobInfoId),
    ).resolves.toBe(false);
  });

  it("propagates unexpected insert failures for unlimited users", async () => {
    mockHasPermission.mockResolvedValueOnce(true);
    mockInsertResumeAnalysisDb.mockRejectedValue(
      new DatabaseError("Insert failed"),
    );

    await expect(
      reserveResumeAnalysisUsage(SIGNED_IN_USER_ID, jobInfoId),
    ).rejects.toThrow(DatabaseError);
  });

  it("propagates unexpected reservation failures for limited users", async () => {
    mockHasPermission.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mockTryInsertResumeAnalysisDb.mockRejectedValue(
      new DatabaseError("Reservation failed"),
    );

    await expect(
      reserveResumeAnalysisUsage(SIGNED_IN_USER_ID, jobInfoId),
    ).rejects.toThrow(DatabaseError);
  });
});
