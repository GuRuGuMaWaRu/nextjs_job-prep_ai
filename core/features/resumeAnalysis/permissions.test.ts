jest.mock("@/core/features/auth/actions", () => ({
  getCurrentUserAction: jest.fn(),
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

import { getCurrentUserAction } from "@/core/features/auth/actions";
import { hasPermission, PERMISSIONS } from "@/core/features/auth/permissions";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeCurrentUser } from "@/core/test-utils/factories/user";

import { checkResumeAnalysisPermission } from "./permissions";

const mockGetCurrentUser = jest.mocked(getCurrentUserAction);
const mockHasPermission = jest.mocked(hasPermission);

const SIGNED_IN_USER_ID = TEST_USER_ID;

describe("checkResumeAnalysisPermission", () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    mockGetCurrentUser.mockResolvedValue(
      makeCurrentUser({ userId: SIGNED_IN_USER_ID }),
    );
    mockHasPermission.mockResolvedValue(true);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
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

  it("returns false when the permission check throws", async () => {
    mockHasPermission.mockRejectedValue(new Error("permission failed"));

    await expect(checkResumeAnalysisPermission()).resolves.toBe(false);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error checking resume analysis permission:",
      expect.any(Error),
    );
  });
});
