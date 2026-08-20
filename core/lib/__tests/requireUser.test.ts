jest.mock("@/core/lib/getCurrentUser", () => ({
  getCurrentUser: jest.fn(),
}));

import { getCurrentUser } from "@/core/lib/getCurrentUser";
import { UnauthorizedError } from "@/core/lib/errors";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeUser } from "@/core/test-utils/factories";

import { requireUser } from "@/core/lib/requireUser";

const mockGetCurrentUser = jest.mocked(getCurrentUser);

describe("requireUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the current user", async () => {
    const user = makeUser({ id: TEST_USER_ID });

    mockGetCurrentUser.mockResolvedValue(user);

    await expect(requireUser()).resolves.toBe(user);

    expect(mockGetCurrentUser).toHaveBeenCalledTimes(1);
  });

  it("throws when no user is authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    await expect(requireUser()).rejects.toThrow(UnauthorizedError);
  });
});
