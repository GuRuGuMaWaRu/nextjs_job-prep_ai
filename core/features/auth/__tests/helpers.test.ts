jest.mock("react", () => {
  const actual = jest.requireActual<typeof import("react")>("react");
  const cacheStores = new Set<Map<string, unknown>>();

  return {
    ...actual,
    cache: jest.fn(
      <TArgs extends unknown[], TReturn>(fn: (...args: TArgs) => TReturn) => {
        const store = new Map<string, TReturn>();
        cacheStores.add(store as Map<string, unknown>);

        return (...args: TArgs): TReturn => {
          const key = JSON.stringify(args);

          if (!store.has(key)) {
            store.set(key, fn(...args));
          }

          return store.get(key) as TReturn;
        };
      },
    ),
    __resetReactCache: () => {
      for (const store of cacheStores) {
        store.clear();
      }
    },
  };
});

jest.mock("@/core/features/auth/password", () => {
  const actual = jest.requireActual<
    typeof import("@/core/features/auth/password")
  >("@/core/features/auth/password");

  return {
    ...actual,
    hashPassword: jest.fn(),
    verifyPassword: jest.fn(),
  };
});

jest.mock("@/core/features/auth/cookies", () => ({
  deleteSessionCookie: jest.fn(),
  getSessionToken: jest.fn(),
}));

jest.mock("@/core/features/auth/session", () => ({
  createSession: jest.fn(),
  extendSessionIfNeeded: jest.fn(),
  getSessionByToken: jest.fn(),
}));

jest.mock("@/core/features/auth/tokens", () => ({
  generateUserId: jest.fn(),
}));

jest.mock("@/core/features/users/actions", () => ({
  getUserAction: jest.fn(),
}));

import { deleteSessionCookie, getSessionToken } from "../cookies";
import { hashPassword, verifyPassword } from "../password";
import {
  createSession,
  extendSessionIfNeeded,
  getSessionByToken,
} from "../session";
import { generateUserId } from "../tokens";
import { getUserAction } from "@/core/features/users/actions";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeSession } from "@/core/test-utils/factories/session";
import { makeUser } from "@/core/test-utils/factories/user";

import { getCurrentUser, validateSessionAndClearCookie } from "../helpers";

const mockDeleteSessionCookie = jest.mocked(deleteSessionCookie);
const mockGetSessionToken = jest.mocked(getSessionToken);
const mockHashPassword = jest.mocked(hashPassword);
const mockVerifyPassword = jest.mocked(verifyPassword);
const mockCreateSession = jest.mocked(createSession);
const mockExtendSessionIfNeeded = jest.mocked(extendSessionIfNeeded);
const mockGetSessionByToken = jest.mocked(getSessionByToken);
const mockGenerateUserId = jest.mocked(generateUserId);
const mockGetUserAction = jest.mocked(getUserAction);

function resetReactCache(): void {
  const reactMock = jest.requireMock("react") as {
    __resetReactCache: () => void;
  };

  reactMock.__resetReactCache();
}

describe("auth helpers", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    resetReactCache();

    mockGenerateUserId.mockReturnValue(TEST_USER_ID);
    mockHashPassword.mockResolvedValue("hashed-password");
    mockCreateSession.mockResolvedValue(makeSession({ userId: TEST_USER_ID }));
    mockVerifyPassword.mockResolvedValue(true);

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("getCurrentUser", () => {
    it("caches current user reads", async () => {
      const session = makeSession({ userId: TEST_USER_ID });
      const user = makeUser({ id: TEST_USER_ID });

      mockGetSessionToken.mockResolvedValue("session-token");
      mockExtendSessionIfNeeded.mockResolvedValue(session);
      mockGetUserAction.mockResolvedValue(user);

      const [userA, userB] = await Promise.all([
        getCurrentUser(),
        getCurrentUser(),
      ]);

      expect(userA).toEqual(userB);
      expect(mockGetSessionToken).toHaveBeenCalledTimes(1);
      expect(mockExtendSessionIfNeeded).toHaveBeenCalledTimes(1);
      expect(mockGetUserAction).toHaveBeenCalledTimes(1);
      expect(mockGetUserAction).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it("returns null for the user when no session token exists", async () => {
      mockGetSessionToken.mockResolvedValueOnce(null);

      const result = await getCurrentUser();

      expect(result).toEqual({
        user: null,
      });
    });

    it("returns null for the user when profile loading throws and logs the error", async () => {
      const session = makeSession({ userId: TEST_USER_ID });
      const error = new Error("profile load failed");
      mockGetSessionToken.mockResolvedValueOnce("session-token");
      mockExtendSessionIfNeeded.mockResolvedValueOnce(session);
      mockGetUserAction.mockRejectedValueOnce(error);

      const result = await getCurrentUser();

      expect(result).toEqual({
        user: null,
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "getCurrentUser: session or user load failed:",
        error,
      );
    });

    it("returns undefined profile data when profile loading returns null", async () => {
      const session = makeSession({ userId: TEST_USER_ID });
      mockGetSessionToken.mockResolvedValueOnce("session-token");
      mockExtendSessionIfNeeded.mockResolvedValueOnce(session);
      mockGetUserAction.mockResolvedValueOnce(null);

      const result = await getCurrentUser();

      expect(result).toEqual({
        user: null,
      });
      expect(mockGetUserAction).toHaveBeenCalledWith(TEST_USER_ID);
    });
  });

  describe("validateSessionAndClearCookie", () => {
    it("returns false without deleting the cookie when validation throws", async () => {
      const error = new Error("database unavailable");
      mockGetSessionByToken.mockRejectedValueOnce(error);

      await expect(
        validateSessionAndClearCookie("session-token"),
      ).resolves.toBe(false);

      expect(mockDeleteSessionCookie).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Session validation error:",
        error,
      );
    });

    it("deletes the cookie and returns false for an invalid session", async () => {
      mockGetSessionByToken.mockResolvedValueOnce(null);

      await expect(
        validateSessionAndClearCookie("invalid-token"),
      ).resolves.toBe(false);

      expect(mockDeleteSessionCookie).toHaveBeenCalledTimes(1);
    });

    it("returns true when validateSessionAndClearCookie finds a valid session", async () => {
      const session = makeSession({ userId: TEST_USER_ID });
      mockGetSessionByToken.mockResolvedValueOnce(session);

      await expect(validateSessionAndClearCookie(session.token)).resolves.toBe(
        true,
      );

      expect(mockGetSessionByToken).toHaveBeenCalledWith(session.token);
      expect(mockDeleteSessionCookie).not.toHaveBeenCalled();
    });
  });
});
