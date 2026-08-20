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

jest.mock("@/core/features/users/service", () => ({
  getUserService: jest.fn(),
}));

import { getSessionToken } from "@/core/features/auth/cookies";
import { hashPassword, verifyPassword } from "@/core/features/auth/password";
import {
  createSession,
  extendSessionIfNeeded,
} from "@/core/features/auth/session";
import { generateUserId } from "@/core/features/auth/tokens";
import { getUserService } from "@/core/features/users/service";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeSession } from "@/core/test-utils/factories/session";
import { makeUser } from "@/core/test-utils/factories/user";

import { getCurrentUser } from "../getCurrentUser";

const mockGetSessionToken = jest.mocked(getSessionToken);
const mockHashPassword = jest.mocked(hashPassword);
const mockVerifyPassword = jest.mocked(verifyPassword);
const mockCreateSession = jest.mocked(createSession);
const mockExtendSessionIfNeeded = jest.mocked(extendSessionIfNeeded);
const mockGenerateUserId = jest.mocked(generateUserId);
const mockGetUserService = jest.mocked(getUserService);

function resetReactCache(): void {
  const reactMock = jest.requireMock("react") as {
    __resetReactCache: () => void;
  };

  reactMock.__resetReactCache();
}

describe("getCurrentUser", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    resetReactCache();

    mockGenerateUserId.mockReturnValue(TEST_USER_ID);
    mockHashPassword.mockResolvedValue("hashed-password");
    mockCreateSession.mockResolvedValue(makeSession({ userId: TEST_USER_ID }));
    mockVerifyPassword.mockResolvedValue(true);
    mockGetSessionToken.mockResolvedValue("session-token");

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
  it("caches current user reads", async () => {
    const session = makeSession({ userId: TEST_USER_ID });
    const user = makeUser({ id: TEST_USER_ID });

    mockExtendSessionIfNeeded.mockResolvedValue(session);
    mockGetUserService.mockResolvedValue(user);

    const [userA, userB] = await Promise.all([
      getCurrentUser(),
      getCurrentUser(),
    ]);

    expect(userA).toEqual(userB);
    expect(mockGetSessionToken).toHaveBeenCalledTimes(1);
    expect(mockExtendSessionIfNeeded).toHaveBeenCalledTimes(1);
    expect(mockGetUserService).toHaveBeenCalledTimes(1);
    expect(mockGetUserService).toHaveBeenCalledWith(TEST_USER_ID);
  });

  it("returns null when no session token exists", async () => {
    mockGetSessionToken.mockResolvedValue(null);

    const result = await getCurrentUser();

    expect(result).toEqual(null);
  });

  it("passes through the error when user service throws", async () => {
    const session = makeSession({ userId: TEST_USER_ID });
    const error = new Error("profile load failed");
    mockExtendSessionIfNeeded.mockResolvedValue(session);
    mockGetUserService.mockRejectedValueOnce(error);

    await expect(getCurrentUser()).rejects.toThrow(error);
    expect(mockGetUserService).toHaveBeenCalledWith(TEST_USER_ID);
  });

  it("returns null when user service returns null", async () => {
    const session = makeSession({ userId: TEST_USER_ID });
    mockExtendSessionIfNeeded.mockResolvedValue(session);
    mockGetUserService.mockResolvedValueOnce(null);

    const result = await getCurrentUser();

    expect(result).toEqual(null);
    expect(mockGetUserService).toHaveBeenCalledWith(TEST_USER_ID);
  });
});
