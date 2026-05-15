jest.mock("@/core/features/auth/actions", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("@/core/features/auth/permissions", () => ({
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

import { getCurrentUser } from "@/core/features/auth/actions";
import {
  hasPermission,
  PERMISSIONS,
} from "@/core/features/auth/permissions";

import { checkResumeAnalysisPermission } from "./permissions";

const mockGetCurrentUser = jest.mocked(getCurrentUser);
const mockHasPermission = jest.mocked(hasPermission);

describe("checkResumeAnalysisPermission", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue({ userId: "user-1" });
    mockHasPermission.mockResolvedValue(true);
  });

  it("denies anonymous users without checking plan permissions", async () => {
    mockGetCurrentUser.mockResolvedValue({ userId: null });

    await expect(checkResumeAnalysisPermission()).resolves.toBe(false);

    expect(mockHasPermission).not.toHaveBeenCalled();
  });

  it("delegates signed-in users to the resume analysis permission", async () => {
    await expect(checkResumeAnalysisPermission()).resolves.toBe(true);

    expect(mockHasPermission).toHaveBeenCalledWith(
      PERMISSIONS.UNLIMITED.RESUME_ANALYSES,
    );
  });
});
