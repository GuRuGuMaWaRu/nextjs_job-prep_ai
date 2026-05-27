jest.mock("next/navigation", () => {
  const { createNextNavigationMock } = jest.requireActual<
    typeof import("@core/test-utils/mocks/next")
  >("@core/test-utils/mocks/next");

  return createNextNavigationMock();
});

jest.mock("next/headers", () => {
  const { createNextHeadersMock } = jest.requireActual<
    typeof import("@core/test-utils/mocks/next")
  >("@core/test-utils/mocks/next");

  return createNextHeadersMock();
});

jest.mock("@/core/features/auth/oauth/base", () => ({
  getOAuthClient: jest.fn(),
}));

jest.mock("@/core/features/auth/oauth/connectUser", () => ({
  connectUserToAccount: jest.fn(),
}));

jest.mock("@/core/features/auth/oauth/config", () => ({
  getOAuthConfig: jest.fn(),
}));

jest.mock("@/core/features/auth/oauth/oauthErrorReturn", () => ({
  clearOAuthErrorReturnCookie: jest.fn(),
  getOAuthErrorReturnPathAndClear: jest.fn(),
}));

jest.mock("@/core/features/auth/oauth/oauthLastUsed", () => ({
  setLastUsedOAuthProviderCookie: jest.fn(),
}));

jest.mock("@/core/features/auth/session", () => ({
  createSession: jest.fn(),
}));

jest.mock("@/core/features/auth/cookies", () => ({
  setSessionCookie: jest.fn(),
}));

import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { routes } from "@/core/data/routes";
import { getOAuthClient } from "@/core/features/auth/oauth/base";
import { connectUserToAccount } from "@/core/features/auth/oauth/connectUser";
import { getOAuthConfig } from "@/core/features/auth/oauth/config";
import {
  OAuthMissingEmailError,
  OAuthNoVerifiedEmailError,
  OAuthUnverifiedEmailError,
} from "@/core/features/auth/oauth/errors";
import {
  clearOAuthErrorReturnCookie,
  getOAuthErrorReturnPathAndClear,
} from "@/core/features/auth/oauth/oauthErrorReturn";
import { setLastUsedOAuthProviderCookie } from "@/core/features/auth/oauth/oauthLastUsed";
import { setSessionCookie } from "@/core/features/auth/cookies";
import { createSession } from "@/core/features/auth/session";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeSession } from "@/core/test-utils/factories";

import { GET } from "./route";

const mockRedirect = jest.mocked(redirect);
const mockCookies = jest.mocked(cookies);
const mockGetOAuthClient = jest.mocked(getOAuthClient);
const mockConnectUserToAccount = jest.mocked(connectUserToAccount);
const mockGetOAuthConfig = jest.mocked(getOAuthConfig);
const mockClearOAuthErrorReturnCookie = jest.mocked(
  clearOAuthErrorReturnCookie,
);
const mockGetOAuthErrorReturnPathAndClear = jest.mocked(
  getOAuthErrorReturnPathAndClear,
);
const mockSetLastUsedOAuthProviderCookie = jest.mocked(
  setLastUsedOAuthProviderCookie,
);
const mockSetSessionCookie = jest.mocked(setSessionCookie);
const mockCreateSession = jest.mocked(createSession);

const mockFetchUser = jest.fn();
const PROVIDER = "google" as const;
const OAUTH_USER = {
  id: "oauth-user-1",
  email: "oauth-user-1@test.local",
  emailVerified: true,
  name: "OAuth User",
  image: null,
};

function buildRequest({
  rawProvider = PROVIDER,
  searchParams = "code=test_code&state=test_state",
}: {
  rawProvider?: string;
  searchParams?: string;
} = {}) {
  return new NextRequest(
    `http://localhost:3000/api/oauth/${rawProvider}?${searchParams}`,
    { method: "GET" },
  );
}

function buildContext(rawProvider: string = PROVIDER) {
  return {
    params: Promise.resolve({ provider: rawProvider }),
  };
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

describe("GET /api/oauth/[provider]", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetOAuthConfig.mockReturnValue({
      clientId: "client_id",
      clientSecret: "client_secret",
    });
    mockGetOAuthClient.mockReturnValue({
      createAuthUrl: jest.fn(),
      fetchUser: mockFetchUser,
    } as unknown as ReturnType<typeof getOAuthClient>);
    mockFetchUser.mockResolvedValue(OAUTH_USER);
    mockConnectUserToAccount.mockResolvedValue({ id: TEST_USER_ID });
    mockCreateSession.mockResolvedValue(makeSession({ userId: TEST_USER_ID }));
    mockGetOAuthErrorReturnPathAndClear.mockResolvedValue(routes.signIn);

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("redirects with oauth_invalid_provider when the provider is unsupported", async () => {
    await expectRedirectTo(
      GET(buildRequest({ rawProvider: "facebook" }), buildContext("facebook")),
      `${routes.signIn}?oauthError=oauth_invalid_provider`,
    );

    expect(mockGetOAuthErrorReturnPathAndClear).toHaveBeenCalledTimes(1);
    expect(mockGetOAuthConfig).not.toHaveBeenCalled();
    expect(mockGetOAuthClient).not.toHaveBeenCalled();
  });

  it("redirects with oauth_failed when the callback code is missing", async () => {
    await expectRedirectTo(
      GET(buildRequest({ searchParams: "state=test_state" }), buildContext()),
      `${routes.signIn}?oauthError=oauth_failed`,
    );

    expect(mockGetOAuthClient).not.toHaveBeenCalled();
    expect(mockConnectUserToAccount).not.toHaveBeenCalled();
  });

  it("redirects with oauth_failed when the callback state is missing", async () => {
    await expectRedirectTo(
      GET(buildRequest({ searchParams: "code=test_code" }), buildContext()),
      `${routes.signIn}?oauthError=oauth_failed`,
    );

    expect(mockGetOAuthClient).not.toHaveBeenCalled();
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  it("redirects with oauth_not_configured when the provider lacks credentials", async () => {
    mockGetOAuthConfig.mockReturnValueOnce(null);

    await expectRedirectTo(
      GET(buildRequest(), buildContext()),
      `${routes.signIn}?oauthError=oauth_not_configured`,
    );

    expect(mockGetOAuthConfig).toHaveBeenCalledWith(PROVIDER);
    expect(mockGetOAuthClient).not.toHaveBeenCalled();
  });

  it("connects the OAuth account, creates a session, stores cookies, and redirects to the app", async () => {
    const session = makeSession({ userId: TEST_USER_ID });
    mockCreateSession.mockResolvedValueOnce(session);

    await expectRedirectTo(GET(buildRequest(), buildContext()), routes.app);

    expect(mockGetOAuthClient).toHaveBeenCalledWith(PROVIDER);
    expect(mockFetchUser).toHaveBeenCalledWith(
      "test_code",
      "test_state",
      await mockCookies.mock.results[0].value,
    );
    expect(mockConnectUserToAccount).toHaveBeenCalledWith(OAUTH_USER, PROVIDER);
    expect(mockCreateSession).toHaveBeenCalledWith(TEST_USER_ID);
    expect(mockSetSessionCookie).toHaveBeenCalledWith(
      session.token,
      session.expiresAt,
    );
    expect(mockSetLastUsedOAuthProviderCookie).toHaveBeenCalledWith(PROVIDER);
    expect(mockClearOAuthErrorReturnCookie).toHaveBeenCalledTimes(1);
    expect(mockGetOAuthErrorReturnPathAndClear).not.toHaveBeenCalled();
  });

  it.each([
    ["oauth_missing_email", new OAuthMissingEmailError(PROVIDER)],
    ["oauth_unverified_email", new OAuthUnverifiedEmailError(PROVIDER)],
    ["oauth_no_verified_email", new OAuthNoVerifiedEmailError(PROVIDER)],
  ])("redirects with %s for known OAuth email errors", async (key, error) => {
    mockFetchUser.mockRejectedValueOnce(error);

    await expectRedirectTo(
      GET(buildRequest(), buildContext()),
      `${routes.signIn}?oauthError=${key}`,
    );

    expect(mockGetOAuthErrorReturnPathAndClear).toHaveBeenCalledTimes(1);
    expect(mockSetSessionCookie).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("logs unexpected callback failures and redirects with oauth_failed", async () => {
    const error = new Error("token exchange failed");
    mockFetchUser.mockRejectedValueOnce(error);

    await expectRedirectTo(
      GET(buildRequest(), buildContext()),
      `${routes.signIn}?oauthError=oauth_failed`,
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith("OAuth error:", error);
    expect(mockClearOAuthErrorReturnCookie).not.toHaveBeenCalled();
  });

  it("uses the stored OAuth error return path for callback failures", async () => {
    mockGetOAuthErrorReturnPathAndClear.mockResolvedValueOnce(routes.signUp);
    mockConnectUserToAccount.mockRejectedValueOnce(
      new OAuthUnverifiedEmailError(PROVIDER),
    );

    await expectRedirectTo(
      GET(buildRequest(), buildContext()),
      `${routes.signUp}?oauthError=oauth_unverified_email`,
    );
  });
});
