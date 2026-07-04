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
    },
  },
  hasPermission: jest.fn(),
}));

jest.mock("@/core/features/interviews/db", () => ({
  getInterviewCountDb: jest.fn(),
  insertInterviewDb: jest.fn(),
  tryInsertInterviewDb: jest.fn(),
}));

import { getCurrentUserAction } from "@/core/features/auth/actions";
import {
  FREE_PLAN_LIMITS,
  hasPermission,
  PERMISSIONS,
} from "@/core/features/auth/permissions";
import {
  getInterviewCountDb,
  insertInterviewDb,
  tryInsertInterviewDb,
} from "@/core/features/interviews/db";
import { DatabaseError } from "@/core/dal/errors";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeCurrentUser } from "@/core/test-utils/factories/user";

import { checkInterviewPermission, reserveInterviewUsage } from "./permissions";

const mockGetCurrentUser = jest.mocked(getCurrentUserAction);
const mockHasPermission = jest.mocked(hasPermission);
const mockGetInterviewCountDb = jest.mocked(getInterviewCountDb);
const mockInsertInterviewDb = jest.mocked(insertInterviewDb);
const mockTryInsertInterviewDb = jest.mocked(tryInsertInterviewDb);

const SIGNED_IN_USER_ID = TEST_USER_ID;

describe("checkInterviewPermission", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue(
      makeCurrentUser({ userId: SIGNED_IN_USER_ID }),
    );
    mockHasPermission.mockResolvedValue(false);
  });

  it("allows users with unlimited interview permission without reading usage", async () => {
    mockHasPermission.mockResolvedValueOnce(true);

    await expect(checkInterviewPermission()).resolves.toBe(true);

    expect(mockHasPermission).toHaveBeenCalledWith(
      PERMISSIONS.UNLIMITED.INTERVIEWS,
    );
    expect(mockGetInterviewCountDb).not.toHaveBeenCalled();
  });

  it("denies users without limited or unlimited interview permission", async () => {
    mockHasPermission.mockResolvedValue(false);

    await expect(checkInterviewPermission()).resolves.toBe(false);

    expect(mockGetCurrentUser).not.toHaveBeenCalled();
    expect(mockGetInterviewCountDb).not.toHaveBeenCalled();
  });

  it("allows limited users below the free interview limit", async () => {
    mockHasPermission.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mockGetInterviewCountDb.mockResolvedValue(FREE_PLAN_LIMITS.interviews - 1);

    await expect(checkInterviewPermission()).resolves.toBe(true);

    expect(mockGetInterviewCountDb).toHaveBeenCalledWith(SIGNED_IN_USER_ID);
  });

  it("treats a missing current user as zero interviews after limited permission is granted", async () => {
    mockHasPermission.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mockGetCurrentUser.mockResolvedValue(makeCurrentUser({ userId: null }));

    await expect(checkInterviewPermission()).resolves.toBe(true);

    expect(mockGetInterviewCountDb).not.toHaveBeenCalled();
  });

  it("denies limited users at the free interview limit", async () => {
    mockHasPermission.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mockGetInterviewCountDb.mockResolvedValue(FREE_PLAN_LIMITS.interviews);

    await expect(checkInterviewPermission()).resolves.toBe(false);
  });
});

describe("reserveInterviewUsage", () => {
  const jobInfoId = "00000000-0000-4000-8000-000000000101";

  beforeEach(() => {
    jest.clearAllMocks();
    mockHasPermission.mockResolvedValue(false);
  });

  it("inserts directly for users with unlimited interview permission", async () => {
    const inserted = { id: "interview-id", jobInfoId };
    mockHasPermission.mockResolvedValueOnce(true);
    mockInsertInterviewDb.mockResolvedValue(inserted);

    await expect(
      reserveInterviewUsage(SIGNED_IN_USER_ID, jobInfoId),
    ).resolves.toEqual(inserted);

    expect(mockInsertInterviewDb).toHaveBeenCalledWith({
      jobInfoId,
      duration: "00:00:00",
    });
    expect(mockTryInsertInterviewDb).not.toHaveBeenCalled();
  });

  it("returns null when the user has no interview permission", async () => {
    await expect(
      reserveInterviewUsage(SIGNED_IN_USER_ID, jobInfoId),
    ).resolves.toBeNull();

    expect(mockInsertInterviewDb).not.toHaveBeenCalled();
    expect(mockTryInsertInterviewDb).not.toHaveBeenCalled();
  });

  it("atomically inserts for a limited user below quota", async () => {
    const inserted = { id: "interview-id", jobInfoId };
    mockHasPermission.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mockTryInsertInterviewDb.mockResolvedValue(inserted);

    await expect(
      reserveInterviewUsage(SIGNED_IN_USER_ID, jobInfoId),
    ).resolves.toEqual(inserted);

    expect(mockTryInsertInterviewDb).toHaveBeenCalledWith({
      userId: SIGNED_IN_USER_ID,
      interview: { jobInfoId, duration: "00:00:00" },
      limit: FREE_PLAN_LIMITS.interviews,
    });
  });

  it("returns null when a limited user has exhausted quota", async () => {
    mockHasPermission.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mockTryInsertInterviewDb.mockResolvedValue(null);

    await expect(
      reserveInterviewUsage(SIGNED_IN_USER_ID, jobInfoId),
    ).resolves.toBeNull();
  });

  it("propagates reservation write failures", async () => {
    mockHasPermission.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mockTryInsertInterviewDb.mockRejectedValue(new Error("Reservation failed"));

    await expect(
      reserveInterviewUsage(SIGNED_IN_USER_ID, jobInfoId),
    ).rejects.toThrow(DatabaseError);
  });
});
