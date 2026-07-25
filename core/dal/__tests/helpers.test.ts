jest.mock("@/core/features/auth/helpers", () => ({
  getCurrentUser: jest.fn(),
}));

import { getCurrentUser } from "@/core/features/auth/helpers";
import { UnauthorizedError } from "@/core/dal/errors";
import { requireUser } from "@/core/dal/helpers";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeUser } from "@/core/test-utils/factories";

const mockGetCurrentUser = jest.mocked(getCurrentUser);

describe("DAL helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("requireUser", () => {
    it("returns the current user", async () => {
      const user = makeUser({ id: TEST_USER_ID });

      mockGetCurrentUser.mockResolvedValue({
        user,
      });

      await expect(requireUser()).resolves.toBe(user);

      expect(mockGetCurrentUser).toHaveBeenCalledTimes(1);
    });

    it("throws when no user is authenticated", async () => {
      mockGetCurrentUser.mockResolvedValue({ user: null });

      await expect(requireUser()).rejects.toThrow(UnauthorizedError);
    });
  });
});
