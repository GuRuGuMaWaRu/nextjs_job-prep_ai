jest.mock("@/core/features/auth/actions", () => ({
  getCurrentUserAction: jest.fn(),
  getCurrentUserWithProfileAction: jest.fn(),
}));

import {
  getCurrentUserAction,
  getCurrentUserWithProfileAction,
} from "@/core/features/auth/actions";
import { UnauthorizedError } from "@/core/dal/errors";
import { requireUser, requireUserWithData } from "@/core/dal/helpers";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeCurrentUser, makeUser } from "@/core/test-utils/factories";

const mockGetCurrentUserAction = jest.mocked(getCurrentUserAction);
const mockGetCurrentUserWithProfileAction = jest.mocked(
  getCurrentUserWithProfileAction,
);

describe("DAL helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("requireUser", () => {
    it("returns the current user id", async () => {
      mockGetCurrentUserAction.mockResolvedValue(
        makeCurrentUser({ userId: TEST_USER_ID }),
      );

      await expect(requireUser()).resolves.toBe(TEST_USER_ID);

      expect(mockGetCurrentUserAction).toHaveBeenCalledTimes(1);
    });

    it("throws when no user is authenticated", async () => {
      mockGetCurrentUserAction.mockResolvedValue(
        makeCurrentUser({ userId: null }),
      );

      await expect(requireUser()).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("requireUserWithData", () => {
    it("returns the current user id and profile", async () => {
      const user = makeUser({ id: TEST_USER_ID });
      mockGetCurrentUserWithProfileAction.mockResolvedValue(
        makeCurrentUser({ userId: TEST_USER_ID, user }),
      );

      await expect(requireUserWithData()).resolves.toEqual({
        userId: TEST_USER_ID,
        user,
      });

      expect(mockGetCurrentUserWithProfileAction).toHaveBeenCalledTimes(1);
    });

    it("throws when no user is authenticated", async () => {
      mockGetCurrentUserWithProfileAction.mockResolvedValue(
        makeCurrentUser({ userId: null }),
      );

      await expect(requireUserWithData()).rejects.toThrow(UnauthorizedError);
    });

    it("throws when the user profile is missing", async () => {
      mockGetCurrentUserWithProfileAction.mockResolvedValue(
        makeCurrentUser({ userId: TEST_USER_ID, user: undefined }),
      );

      await expect(requireUserWithData()).rejects.toThrow(UnauthorizedError);
    });
  });
});
