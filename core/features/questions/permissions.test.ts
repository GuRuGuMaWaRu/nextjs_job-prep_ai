jest.mock("@/core/features/auth/actions", () => ({
  getCurrentUser: jest.fn(),
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

import { getCurrentUser } from "@/core/features/auth/actions";
import {
  FREE_PLAN_LIMITS,
  hasPermission,
  PERMISSIONS,
} from "@/core/features/auth/permissions";
import { getQuestionCountDb } from "@/core/features/questions/db";

import { checkQuestionsPermission } from "./permissions";

const mockGetCurrentUser = jest.mocked(getCurrentUser);
const mockHasPermission = jest.mocked(hasPermission);
const mockGetQuestionCountDb = jest.mocked(getQuestionCountDb);

describe("checkQuestionsPermission", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue({ userId: "user-1" });
    mockHasPermission.mockResolvedValue(false);
  });

  it("denies anonymous users without checking plan permissions", async () => {
    mockGetCurrentUser.mockResolvedValue({ userId: null });

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

    expect(mockGetQuestionCountDb).toHaveBeenCalledWith("user-1");
  });

  it("denies limited users at the free question limit", async () => {
    mockHasPermission.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mockGetQuestionCountDb.mockResolvedValue(FREE_PLAN_LIMITS.questions);

    await expect(checkQuestionsPermission()).resolves.toBe(false);
  });
});
