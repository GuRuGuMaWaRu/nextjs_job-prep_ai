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
import { hasPermission, PERMISSIONS } from "@/core/features/auth/permissions";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeCurrentUser } from "@/core/test-utils/factories/user";

import { checkResumeAnalysisPermission } from "./permissions";

const mockGetCurrentUser = jest.mocked(getCurrentUser);
const mockHasPermission = jest.mocked(hasPermission);

const SIGNED_IN_USER_ID = TEST_USER_ID;

describe("checkResumeAnalysisPermission", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue(
      makeCurrentUser({ userId: SIGNED_IN_USER_ID }),
    );
    mockHasPermission.mockResolvedValue(true);
  });

  it("denies anonymous users without checking plan permissions", async () => {
    mockGetCurrentUser.mockResolvedValue(makeCurrentUser({ userId: null }));

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
