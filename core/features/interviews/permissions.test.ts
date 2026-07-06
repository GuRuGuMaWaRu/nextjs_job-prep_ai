jest.mock("@/core/features/auth/permissions", () => ({
  hasPermission: jest.fn(),
}));

import { hasPermission } from "@/core/features/auth/permissions";
import { PERMISSIONS } from "@/core/data/constants";

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

  it("throws when hasPermission rejects", async () => {
    mockHasPermission.mockRejectedValueOnce(new Error("permission failed"));

    await expect(checkInterviewPermission()).rejects.toThrow(
      "permission failed",
    );
  });
});
