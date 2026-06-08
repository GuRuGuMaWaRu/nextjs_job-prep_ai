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

jest.mock("next/navigation", () => {
  const { createNextNavigationMock } = jest.requireActual<
    typeof import("@core/test-utils/mocks/next")
  >("@core/test-utils/mocks/next");

  return createNextNavigationMock();
});

jest.mock("next/cache", () => {
  const { createNextCacheMock } = jest.requireActual<
    typeof import("@core/test-utils/mocks/next")
  >("@core/test-utils/mocks/next");

  return createNextCacheMock();
});

jest.mock("next/headers", () => {
  const { createNextHeadersMock } = jest.requireActual<
    typeof import("@core/test-utils/mocks/next")
  >("@core/test-utils/mocks/next");

  return createNextHeadersMock();
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
  setSessionCookie: jest.fn(),
}));

jest.mock("@/core/features/auth/session", () => ({
  createSession: jest.fn(),
  deleteSession: jest.fn(),
  extendSessionIfNeeded: jest.fn(),
  validateSession: jest.fn(),
}));

jest.mock("@/core/features/auth/tokens", () => ({
  generateUserId: jest.fn(),
}));

jest.mock("@/core/features/auth/db", () => ({
  createUserDb: jest.fn(),
  findUserByEmailDb: jest.fn(),
}));

jest.mock("@/core/features/auth/oauth/base", () => ({
  getOAuthClient: jest.fn(),
}));

jest.mock("@/core/features/auth/oauth/config", () => ({
  getOAuthConfig: jest.fn(),
}));

jest.mock("@/core/features/auth/oauth/oauthErrorReturn", () => ({
  clearOAuthErrorReturnCookie: jest.fn(),
  setOAuthErrorReturnForNextOAuth: jest.fn(),
}));

jest.mock("@/core/features/users/actions", () => ({
  getUserAction: jest.fn(),
}));

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { routes } from "@/core/data/routes";
import { deleteSessionCookie, getSessionToken, setSessionCookie } from "./cookies";
import { createUserDb, findUserByEmailDb } from "./db";
import { hashPassword, verifyPassword } from "./password";
import {
  createSession,
  deleteSession,
  extendSessionIfNeeded,
  validateSession,
} from "./session";
import { generateUserId } from "./tokens";
import { getUserAction } from "@/core/features/users/actions";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeSession } from "@/core/test-utils/factories/session";
import { makeUser } from "@/core/test-utils/factories/user";

import {
  getCurrentUserAction,
  getCurrentUserWithProfileAction,
  signInAction,
  signOutAction,
  signUpAction,
  validateSessionAction,
} from "./actions";

const mockRedirect = jest.mocked(redirect);
const mockRevalidatePath = jest.mocked(revalidatePath);
const mockDeleteSessionCookie = jest.mocked(deleteSessionCookie);
const mockGetSessionToken = jest.mocked(getSessionToken);
const mockSetSessionCookie = jest.mocked(setSessionCookie);
const mockCreateUserDb = jest.mocked(createUserDb);
const mockFindUserByEmailDb = jest.mocked(findUserByEmailDb);
const mockHashPassword = jest.mocked(hashPassword);
const mockVerifyPassword = jest.mocked(verifyPassword);
const mockCreateSession = jest.mocked(createSession);
const mockDeleteSession = jest.mocked(deleteSession);
const mockExtendSessionIfNeeded = jest.mocked(extendSessionIfNeeded);
const mockValidateSession = jest.mocked(validateSession);
const mockGenerateUserId = jest.mocked(generateUserId);
const mockGetUserAction = jest.mocked(getUserAction);

function resetReactCache(): void {
  const reactMock = jest.requireMock("react") as {
    __resetReactCache: () => void;
  };

  reactMock.__resetReactCache();
}

function buildFormData(
  fields: Record<string, string | Blob | undefined>,
): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) {
      continue;
    }

    formData.set(key, value);
  }

  return formData;
}

async function expectRedirectTo(
  promise: Promise<unknown>,
  location: string,
): Promise<void> {
  await expect(promise).rejects.toMatchObject({
    digest: expect.stringContaining(location),
  });
  expect(mockRedirect).toHaveBeenCalledWith(location);
}

describe("auth actions", () => {
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

  it("returns sign-up validation errors without creating a user", async () => {
    const result = await signUpAction(
      null,
      buildFormData({
        name: " ",
        email: "not-an-email",
        password: "letters-only",
      }),
    );

    expect(result).toEqual({
      error: "Please correct the highlighted fields.",
      fields: {
        name: " ",
        email: "not-an-email",
      },
      fieldErrors: {
        name: "Name is required",
        email: "Invalid email address",
        password: "Password must contain at least one letter and one number",
      },
    });
    expect(mockFindUserByEmailDb).not.toHaveBeenCalled();
    expect(mockCreateUserDb).not.toHaveBeenCalled();
    expect(mockSetSessionCookie).not.toHaveBeenCalled();
  });

  it("returns duplicate email errors without hashing or creating a session", async () => {
    const existingUser = makeUser({ email: "ada@test.local" });
    mockFindUserByEmailDb.mockResolvedValueOnce(existingUser);

    const result = await signUpAction(
      null,
      buildFormData({
        name: "Ada Lovelace",
        email: "ADA@test.local",
        password: "abc12345",
      }),
    );

    expect(result).toEqual({
      error: "An account with this email already exists",
      fields: {
        name: "Ada Lovelace",
        email: "ADA@test.local",
      },
      fieldErrors: {
        email: "An account with this email already exists",
      },
    });
    expect(mockFindUserByEmailDb).toHaveBeenCalledWith("ADA@test.local");
    expect(mockHashPassword).not.toHaveBeenCalled();
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  it("returns sign-in validation errors without loading a user", async () => {
    const result = await signInAction(
      null,
      buildFormData({
        email: "bad-email",
        password: "",
      }),
    );

    expect(result).toEqual({
      error: "Please correct the highlighted fields.",
      fields: {
        email: "bad-email",
      },
      fieldErrors: {
        email: "Invalid email address",
        password: "Password is required",
      },
    });
    expect(mockFindUserByEmailDb).not.toHaveBeenCalled();
    expect(mockVerifyPassword).not.toHaveBeenCalled();
  });

  it("returns a generic sign-in error for a bad password", async () => {
    mockFindUserByEmailDb.mockResolvedValueOnce(
      makeUser({
        id: TEST_USER_ID,
        email: "ada@test.local",
        passwordHash: "stored-hash",
      }),
    );
    mockVerifyPassword.mockResolvedValueOnce(false);

    const result = await signInAction(
      null,
      buildFormData({
        email: "ada@test.local",
        password: "wrong123",
      }),
    );

    expect(result).toEqual({
      error: "Invalid email or password",
      fields: {
        email: "ada@test.local",
      },
    });
    expect(mockVerifyPassword).toHaveBeenCalledWith("wrong123", "stored-hash");
    expect(mockCreateSession).not.toHaveBeenCalled();
    expect(mockSetSessionCookie).not.toHaveBeenCalled();
  });

  it("deletes the active session cookie, revalidates the app, and redirects on sign-out", async () => {
    mockGetSessionToken.mockResolvedValueOnce("session-token");

    await expectRedirectTo(signOutAction(), routes.landing);

    expect(mockDeleteSession).toHaveBeenCalledWith("session-token");
    expect(mockDeleteSessionCookie).toHaveBeenCalledTimes(1);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("caches current user session reads and keeps profile loading as a separate cache key", async () => {
    const session = makeSession({ userId: TEST_USER_ID });
    const user = makeUser({ id: TEST_USER_ID });

    mockGetSessionToken.mockResolvedValue("session-token");
    mockExtendSessionIfNeeded.mockResolvedValue(session);
    mockGetUserAction.mockResolvedValue(user);

    const sessionOnlyA = await getCurrentUserAction();
    const sessionOnlyB = await getCurrentUserAction();
    const withProfileA = await getCurrentUserWithProfileAction();
    const withProfileB = await getCurrentUserWithProfileAction();

    expect(sessionOnlyA).toEqual({
      userId: TEST_USER_ID,
      user: undefined,
      redirectToSignIn: expect.any(Function),
    });
    expect(sessionOnlyB).toBe(sessionOnlyA);
    expect(withProfileA).toEqual({
      userId: TEST_USER_ID,
      user,
      redirectToSignIn: expect.any(Function),
    });
    expect(withProfileB).toBe(withProfileA);
    expect(mockGetSessionToken).toHaveBeenCalledTimes(1);
    expect(mockExtendSessionIfNeeded).toHaveBeenCalledTimes(1);
    expect(mockGetUserAction).toHaveBeenCalledTimes(1);
    expect(mockGetUserAction).toHaveBeenCalledWith(TEST_USER_ID);
  });

  it("returns an anonymous current user when no session token exists", async () => {
    mockGetSessionToken.mockResolvedValueOnce(null);

    const result = await getCurrentUserAction();

    expect(result).toEqual({
      userId: null,
      redirectToSignIn: expect.any(Function),
    });
    expect(mockExtendSessionIfNeeded).not.toHaveBeenCalled();
    await expectRedirectTo(
      Promise.resolve().then(() => result.redirectToSignIn()),
      routes.signIn,
    );
  });

  it("returns true when validateSessionAction finds a valid session", async () => {
    const session = makeSession({ userId: TEST_USER_ID });
    mockValidateSession.mockResolvedValueOnce(session);

    await expect(validateSessionAction(session.token)).resolves.toBe(true);

    expect(mockValidateSession).toHaveBeenCalledWith(session.token);
    expect(mockDeleteSessionCookie).not.toHaveBeenCalled();
  });

  it("deletes the cookie and returns false for an invalid session", async () => {
    mockValidateSession.mockResolvedValueOnce(null);

    await expect(validateSessionAction("invalid-token")).resolves.toBe(false);

    expect(mockDeleteSessionCookie).toHaveBeenCalledTimes(1);
  });

  it("returns false without deleting the cookie when validation throws", async () => {
    const error = new Error("database unavailable");
    mockValidateSession.mockRejectedValueOnce(error);

    await expect(validateSessionAction("session-token")).resolves.toBe(false);

    expect(mockDeleteSessionCookie).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Session validation error:",
      error,
    );
  });
});
