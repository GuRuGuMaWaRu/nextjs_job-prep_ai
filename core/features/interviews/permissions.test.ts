jest.mock("@/core/features/auth/permissions", () => ({
  PERMISSIONS: {
    INTERVIEWS: "interviews",
    QUESTIONS: "questions",
    RESUME_ANALYSES: "resume_analyses",
  },
  hasPermission: jest.fn(),
}));

import { hasPermission, PERMISSIONS } from "@/core/features/auth/permissions";

import { checkInterviewPermission } from "./permissions";

const mockHasPermission = jest.mocked(hasPermission);

describe("checkInterviewPermission", () => {
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

    await checkInterviewPermission();

    expect(mockHasPermission).toHaveBeenCalledWith(PERMISSIONS.INTERVIEWS);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("returns true when hasPermission resolves true", async () => {
    mockHasPermission.mockResolvedValueOnce(true);

    await expect(checkInterviewPermission()).resolves.toBe(true);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("returns false when hasPermission resolves false", async () => {
    mockHasPermission.mockResolvedValueOnce(false);

    await expect(checkInterviewPermission()).resolves.toBe(false);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("returns false when hasPermission rejects", async () => {
    mockHasPermission.mockRejectedValueOnce(new Error("permission failed"));

    await expect(checkInterviewPermission()).resolves.toBe(false);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error checking interview permission:",
      expect.any(Error),
    );
  });
});
