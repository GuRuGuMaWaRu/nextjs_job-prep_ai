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

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { routes } from "@/core/data/routes";
import { getOAuthClient } from "@/core/features/auth/oauth/base";
import { getOAuthConfig } from "@/core/features/auth/oauth/config";
import {
  clearOAuthErrorReturnCookie,
  setOAuthErrorReturnForNextOAuth,
} from "@/core/features/auth/oauth/oauthErrorReturn";
import type { Cookies } from "@/core/features/auth/oauth/types";

import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeSession } from "@/core/test-utils/factories/session";
import { makeUserWithPassword } from "@/core/test-utils/factories/user";

import {
  deleteSessionCookie,
  getSessionToken,
  setSessionCookie,
} from "../cookies";
import { createUserDb, findUserByEmailDb } from "../db";
import { hashPassword, verifyPassword } from "../password";
import { createSession, deleteSession } from "../session";
import { generateUserId } from "../tokens";
import {
  signInAction,
  signInWithOAuthAction,
  signOutAction,
  signUpAction,
} from "../actions";

const mockRedirect = jest.mocked(redirect);
const mockRevalidatePath = jest.mocked(revalidatePath);
const mockCookies = jest.mocked(cookies);
const mockGetOAuthClient = jest.mocked(getOAuthClient);
const mockGetOAuthConfig = jest.mocked(getOAuthConfig);
const mockClearOAuthErrorReturnCookie = jest.mocked(
  clearOAuthErrorReturnCookie,
);
const mockSetOAuthErrorReturnForNextOAuth = jest.mocked(
  setOAuthErrorReturnForNextOAuth,
);
const mockDeleteSessionCookie = jest.mocked(deleteSessionCookie);
const mockGetSessionToken = jest.mocked(getSessionToken);
const mockSetSessionCookie = jest.mocked(setSessionCookie);
const mockCreateUserDb = jest.mocked(createUserDb);
const mockFindUserByEmailDb = jest.mocked(findUserByEmailDb);
const mockHashPassword = jest.mocked(hashPassword);
const mockVerifyPassword = jest.mocked(verifyPassword);
const mockCreateSession = jest.mocked(createSession);
const mockDeleteSession = jest.mocked(deleteSession);
const mockGenerateUserId = jest.mocked(generateUserId);

// function resetReactCache(): void {
//   const reactMock = jest.requireMock("react") as {
//     __resetReactCache: () => void;
//   };

//   reactMock.__resetReactCache();
// }

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

function createMockOAuthClient(authUrl: string) {
  const createAuthUrl: jest.MockedFunction<
    (cookies: Pick<Cookies, "set">) => string
  > = jest.fn((_cookies: Pick<Cookies, "set">) => authUrl);

  // OAuthClient has private fields, so a structural test double needs a narrow
  // boundary cast after defining the public method this action calls.
  const client = {
    createAuthUrl,
  } as unknown as ReturnType<typeof getOAuthClient>;

  return { client, createAuthUrl };
}

async function expectRedirectTo(
  promise: Promise<unknown>,
  location: string,
): Promise<void> {
  await expect(promise).rejects.toThrow();
  expect(mockRedirect).toHaveBeenCalledWith(location);
}

describe("auth actions", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // resetReactCache();

    mockGenerateUserId.mockReturnValue(TEST_USER_ID);
    mockHashPassword.mockResolvedValue("hashed-password");
    mockCreateSession.mockResolvedValue(makeSession({ userId: TEST_USER_ID }));
    mockVerifyPassword.mockResolvedValue(true);

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("signUpAction", () => {
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

    it("treats non-string sign-up form values as empty strings", async () => {
      const result = await signUpAction(
        null,
        buildFormData({
          name: new Blob(["Ada"]),
          email: new Blob(["ada@test.local"]),
          password: new Blob(["abc12345"]),
        }),
      );

      expect(result).toEqual({
        error: "Please correct the highlighted fields.",
        fields: {
          name: "",
          email: "",
        },
        fieldErrors: {
          name: "Name is required",
          email: "Email is required",
          password: "Password must be at least 8 characters",
        },
      });
      expect(mockFindUserByEmailDb).not.toHaveBeenCalled();
    });

    it("returns duplicate email errors without hashing or creating a session", async () => {
      const existingUser = makeUserWithPassword({ email: "ada@test.local" });
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

    it("creates a user session and redirects after successful sign-up", async () => {
      const session = makeSession({ userId: TEST_USER_ID });
      mockFindUserByEmailDb.mockResolvedValueOnce(undefined);
      mockCreateSession.mockResolvedValueOnce(session);

      await expectRedirectTo(
        signUpAction(
          null,
          buildFormData({
            name: "Ada Lovelace",
            email: "ADA@test.local",
            password: "abc12345",
          }),
        ),
        routes.app,
      );

      expect(mockFindUserByEmailDb).toHaveBeenCalledWith("ADA@test.local");
      expect(mockCreateUserDb).toHaveBeenCalledWith({
        id: TEST_USER_ID,
        name: "Ada Lovelace",
        email: "ada@test.local",
        passwordHash: "hashed-password",
      });
      expect(mockSetSessionCookie).toHaveBeenCalledWith(
        session.token,
        session.expiresAt,
      );
    });

    it("returns a sign-up error and preserved fields when user creation throws", async () => {
      const error = new Error("insert failed");
      mockFindUserByEmailDb.mockResolvedValueOnce(undefined);
      mockCreateUserDb.mockRejectedValueOnce(error);

      const result = await signUpAction(
        null,
        buildFormData({
          name: "Ada Lovelace",
          email: "ada@test.local",
          password: "abc12345",
        }),
      );

      expect(result).toEqual({
        error: "An error occurred during signup",
        fields: {
          name: "Ada Lovelace",
          email: "ada@test.local",
        },
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith("Signup error:", error);
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("signInAction", () => {
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
          name: undefined,
          email: "Invalid email address",
          password: "Password is required",
        },
      });
      expect(mockFindUserByEmailDb).not.toHaveBeenCalled();
      expect(mockVerifyPassword).not.toHaveBeenCalled();
    });

    it("treats non-string sign-in form values as empty strings", async () => {
      const result = await signInAction(
        null,
        buildFormData({
          email: new Blob(["ada@test.local"]),
          password: new Blob(["abc12345"]),
        }),
      );

      expect(result).toEqual({
        error: "Please correct the highlighted fields.",
        fields: {
          email: "",
        },
        fieldErrors: {
          name: undefined,
          email: "Email is required",
          password: "Password is required",
        },
      });
      expect(mockFindUserByEmailDb).not.toHaveBeenCalled();
    });

    it("returns a generic sign-in error for a bad password", async () => {
      mockFindUserByEmailDb.mockResolvedValueOnce(
        makeUserWithPassword(
          {
            id: TEST_USER_ID,
            email: "ada@test.local",
          },
          {
            passwordHash: "stored-hash",
          },
        ),
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
      expect(mockVerifyPassword).toHaveBeenCalledWith(
        "wrong123",
        "stored-hash",
      );
      expect(mockCreateSession).not.toHaveBeenCalled();
      expect(mockSetSessionCookie).not.toHaveBeenCalled();
    });

    it("returns a generic sign-in error when the user is not found", async () => {
      mockFindUserByEmailDb.mockResolvedValueOnce(undefined);

      const result = await signInAction(
        null,
        buildFormData({
          email: "ada@test.local",
          password: "abc12345",
        }),
      );

      expect(result).toEqual({
        error: "Invalid email or password",
        fields: {
          email: "ada@test.local",
        },
      });
      expect(mockVerifyPassword).not.toHaveBeenCalled();
    });

    it("returns a generic sign-in error when the user has no password hash", async () => {
      mockFindUserByEmailDb.mockResolvedValueOnce(
        makeUserWithPassword(
          {
            id: TEST_USER_ID,
            email: "ada@test.local",
          },
          {
            passwordHash: null,
          },
        ),
      );

      const result = await signInAction(
        null,
        buildFormData({
          email: "ada@test.local",
          password: "abc12345",
        }),
      );

      expect(result).toEqual({
        error: "Invalid email or password",
        fields: {
          email: "ada@test.local",
        },
      });
      expect(mockVerifyPassword).not.toHaveBeenCalled();
    });

    it("creates a session and redirects after successful sign-in", async () => {
      const session = makeSession({ userId: TEST_USER_ID });
      mockFindUserByEmailDb.mockResolvedValueOnce(
        makeUserWithPassword(
          {
            id: TEST_USER_ID,
            email: "ada@test.local",
          },
          {
            passwordHash: "stored-hash",
          },
        ),
      );
      mockCreateSession.mockResolvedValueOnce(session);

      await expectRedirectTo(
        signInAction(
          null,
          buildFormData({
            email: "ada@test.local",
            password: "abc12345",
          }),
        ),
        routes.app,
      );

      expect(mockCreateSession).toHaveBeenCalledWith(TEST_USER_ID);
      expect(mockSetSessionCookie).toHaveBeenCalledWith(
        session.token,
        session.expiresAt,
      );
    });

    it("returns a sign-in error and preserved fields when user lookup throws", async () => {
      const error = new Error("lookup failed");
      mockFindUserByEmailDb.mockRejectedValueOnce(error);

      const result = await signInAction(
        null,
        buildFormData({
          email: "ada@test.local",
          password: "abc12345",
        }),
      );

      expect(result).toEqual({
        error: "An error occurred during sign in",
        fields: {
          email: "ada@test.local",
        },
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith("Signin error:", error);
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("signOutAction", () => {
    it("deletes active session and active session cookie, revalidates, and redirects to the landing page on sign-out", async () => {
      mockGetSessionToken.mockResolvedValueOnce("session-token");

      await expectRedirectTo(signOutAction(), routes.landing);

      expect(mockDeleteSession).toHaveBeenCalledWith("session-token");
      expect(mockDeleteSessionCookie).toHaveBeenCalledTimes(1);
      expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
    });

    it("deletes active session cookie, revalidates, and redirects to the landing page on sign-out without a session token", async () => {
      mockGetSessionToken.mockResolvedValueOnce(null);

      await expectRedirectTo(signOutAction(), routes.landing);

      expect(mockDeleteSession).not.toHaveBeenCalled();
      expect(mockDeleteSessionCookie).toHaveBeenCalledTimes(1);
      expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
    });
  });

  describe("signInWithOAuthAction", () => {
    it("redirects sign-in OAuth to a default error path when the provider is unconfigured", async () => {
      mockGetOAuthConfig.mockReturnValueOnce(null);

      await expectRedirectTo(
        signInWithOAuthAction("github"),
        `${routes.signIn}?oauthError=oauth_not_configured`,
      );

      expect(mockClearOAuthErrorReturnCookie).toHaveBeenCalledTimes(1);
      expect(mockSetOAuthErrorReturnForNextOAuth).not.toHaveBeenCalled();
    });

    it("redirects sign-up OAuth to a sign-up error path when the provider is unconfigured", async () => {
      mockGetOAuthConfig.mockReturnValueOnce(null);

      await expectRedirectTo(
        signInWithOAuthAction("google", { errorReturn: "sign-up" }),
        `${routes.signUp}?oauthError=oauth_not_configured`,
      );

      expect(mockClearOAuthErrorReturnCookie).toHaveBeenCalledTimes(1);
      expect(mockSetOAuthErrorReturnForNextOAuth).not.toHaveBeenCalled();
    });

    it("starts configured OAuth with the sign-in error return by default", async () => {
      const authUrl = "https://auth.test.local/authorize";
      const { client, createAuthUrl } = createMockOAuthClient(authUrl);
      mockGetOAuthConfig.mockReturnValueOnce({
        clientId: "client-id",
        clientSecret: "client-secret",
      });
      mockGetOAuthClient.mockReturnValueOnce(client);
      const cookieStore = await mockCookies();

      await expectRedirectTo(signInWithOAuthAction("github"), authUrl);

      expect(mockSetOAuthErrorReturnForNextOAuth).toHaveBeenCalledWith(
        "sign-in",
      );
      expect(createAuthUrl).toHaveBeenCalledWith(cookieStore);
    });

    it("starts configured OAuth with the requested sign-up error return", async () => {
      const authUrl = "https://auth.test.local/sign-up-authorize";
      const { client, createAuthUrl } = createMockOAuthClient(authUrl);
      mockGetOAuthConfig.mockReturnValueOnce({
        clientId: "client-id",
        clientSecret: "client-secret",
      });
      mockGetOAuthClient.mockReturnValueOnce(client);
      const cookieStore = await mockCookies();

      await expectRedirectTo(
        signInWithOAuthAction("google", { errorReturn: "sign-up" }),
        authUrl,
      );

      expect(mockSetOAuthErrorReturnForNextOAuth).toHaveBeenCalledWith(
        "sign-up",
      );
      expect(createAuthUrl).toHaveBeenCalledWith(cookieStore);
    });
  });
});
