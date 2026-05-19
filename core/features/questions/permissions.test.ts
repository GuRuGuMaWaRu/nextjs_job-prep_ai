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

jest.mock("@/core/features/questions/db", () => ({
  getQuestionCountDb: jest.fn(),
}));

import { getCurrentUserAction } from "@/core/features/auth/actions";
import {
  FREE_PLAN_LIMITS,
  hasPermission,
  PERMISSIONS,
} from "@/core/features/auth/permissions";
import { getQuestionCountDb } from "@/core/features/questions/db";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeCurrentUser } from "@/core/test-utils/factories/user";

import { checkQuestionsPermission } from "./permissions";

const mockGetCurrentUser = jest.mocked(getCurrentUserAction);
const mockHasPermission = jest.mocked(hasPermission);
const mockGetQuestionCountDb = jest.mocked(getQuestionCountDb);

const SIGNED_IN_USER_ID = TEST_USER_ID;

describe("checkQuestionsPermission", () => {
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

    await expect(checkQuestionsPermission()).resolves.toBe(false);

    expect(mockHasPermission).not.toHaveBeenCalled();
    expect(mockGetQuestionCountDb).not.toHaveBeenCalled();
  });

  it("allows users with unlimited question permission without reading usage", async () => {
    mockHasPermission.mockResolvedValueOnce(true);

    await expect(checkQuestionsPermission()).resolves.toBe(true);

    expect(mockHasPermission).toHaveBeenCalledWith(
      PERMISSIONS.UNLIMITED.QUESTIONS,
    );
    expect(mockGetQuestionCountDb).not.toHaveBeenCalled();
  });

  it("denies users without limited or unlimited question permission", async () => {
    mockHasPermission.mockResolvedValue(false);

    await expect(checkQuestionsPermission()).resolves.toBe(false);

    expect(mockGetQuestionCountDb).not.toHaveBeenCalled();
  });

  it("allows limited users below the free question limit", async () => {
    mockHasPermission.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mockGetQuestionCountDb.mockResolvedValue(FREE_PLAN_LIMITS.questions - 1);

    await expect(checkQuestionsPermission()).resolves.toBe(true);

    expect(mockGetCurrentUser).toHaveBeenCalledTimes(1);
    expect(mockGetQuestionCountDb).toHaveBeenCalledWith(SIGNED_IN_USER_ID);
  });

  it("denies limited users at the free question limit", async () => {
    mockHasPermission.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mockGetQuestionCountDb.mockResolvedValue(FREE_PLAN_LIMITS.questions);

    await expect(checkQuestionsPermission()).resolves.toBe(false);

    expect(mockGetCurrentUser).toHaveBeenCalledTimes(1);
  });

  it("returns false when the current user lookup throws", async () => {
    mockGetCurrentUser.mockRejectedValue(new Error("session failed"));

    await expect(checkQuestionsPermission()).resolves.toBe(false);

    expect(mockHasPermission).not.toHaveBeenCalled();
    expect(mockGetQuestionCountDb).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error checking question permission:",
      expect.any(Error),
    );
  });

  it("returns false when the plan permission check throws", async () => {
    mockHasPermission.mockRejectedValue(new Error("permission failed"));

    await expect(checkQuestionsPermission()).resolves.toBe(false);

    expect(mockGetQuestionCountDb).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error checking question permission:",
      expect.any(Error),
    );
  });

  it("returns false when the question count lookup throws", async () => {
    mockHasPermission.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mockGetQuestionCountDb.mockRejectedValue(new Error("count failed"));

    await expect(checkQuestionsPermission()).resolves.toBe(false);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error checking question permission:",
      expect.any(Error),
    );
  });
});
