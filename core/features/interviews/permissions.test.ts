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

jest.mock("@/core/features/interviews/db", () => ({
  getInterviewCountDb: jest.fn(),
}));

import { getCurrentUser } from "@/core/features/auth/actions";
import {
  FREE_PLAN_LIMITS,
  hasPermission,
  PERMISSIONS,
} from "@/core/features/auth/permissions";
import { getInterviewCountDb } from "@/core/features/interviews/db";

import { checkInterviewPermission } from "./permissions";

const mockGetCurrentUser = jest.mocked(getCurrentUser);
const mockHasPermission = jest.mocked(hasPermission);
const mockGetInterviewCountDb = jest.mocked(getInterviewCountDb);

describe("checkInterviewPermission", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue({ userId: "user-1" });
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

    expect(mockGetInterviewCountDb).toHaveBeenCalledWith("user-1");
  });

  it("denies limited users at the free interview limit", async () => {
    mockHasPermission.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mockGetInterviewCountDb.mockResolvedValue(FREE_PLAN_LIMITS.interviews);

    await expect(checkInterviewPermission()).resolves.toBe(false);
  });

});
