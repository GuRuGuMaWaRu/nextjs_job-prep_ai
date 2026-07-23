jest.mock("@/core/data/env/server", () => ({
  env: {
    OAUTH_REDIRECT_URL_BASE: "http://localhost:3000/api/oauth/",
  },
}));

jest.mock("@/core/features/auth/oauth/config", () => ({
  getOAuthConfig: jest.fn(),
}));

jest.mock("@/core/features/auth/oauth/discord", () => ({
  createDiscordOAuthClient: jest.fn(),
}));

jest.mock("@/core/features/auth/oauth/github", () => ({
  createGithubOAuthClient: jest.fn(),
}));

jest.mock("@/core/features/auth/oauth/google", () => ({
  createGoogleOAuthClient: jest.fn(),
}));

import z from "zod";
import crypto from "crypto";

import { OAuthClient, getOAuthClient } from "@/core/features/auth/oauth/base";
import { getOAuthConfig } from "@/core/features/auth/oauth/config";
import { createDiscordOAuthClient } from "@/core/features/auth/oauth/discord";
import {
  InvalidCodeVerifierError,
  InvalidStateError,
  InvalidTokenError,
  InvalidUserError,
  OAuthNotConfiguredError,
  OAuthUserInfoHttpError,
} from "@/core/features/auth/oauth/errors";
import { createGithubOAuthClient } from "@/core/features/auth/oauth/github";
import { createGoogleOAuthClient } from "@/core/features/auth/oauth/google";
import type { Cookies } from "@/core/features/auth/oauth/types";

const authUrl = "https://provider.test/oauth/authorize";
const tokenUrl = "https://provider.test/oauth/token";
const userUrl = "https://provider.test/user";
const maxHttpErrorBodyPreviewLength = 512;

const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  verified: z.boolean(),
});

type UserPayload = z.infer<typeof userSchema>;

const resolvedUser = {
  id: "oauth-user-id",
  email: "candidate@test.local",
  name: "Test Candidate",
  emailVerified: true,
};

const userPayload: UserPayload = {
  id: resolvedUser.id,
  email: resolvedUser.email,
  name: resolvedUser.name,
  verified: resolvedUser.emailVerified,
};

const parser = jest.fn((data: UserPayload) => ({
  id: data.id,
  email: data.email,
  name: data.name,
  emailVerified: data.verified,
}));
const mockGetOAuthConfig = jest.mocked(getOAuthConfig);
const mockCreateDiscordOAuthClient = jest.mocked(createDiscordOAuthClient);
const mockCreateGithubOAuthClient = jest.mocked(createGithubOAuthClient);
const mockCreateGoogleOAuthClient = jest.mocked(createGoogleOAuthClient);

function createClient() {
  parser.mockClear();

  return new OAuthClient({
    provider: "github",
    clientId: "client-id",
    clientSecret: "client-secret",
    scopes: ["read:user", "user:email"],
    urls: {
      auth: authUrl,
      token: tokenUrl,
      user: userUrl,
    },
    userInfo: {
      schema: userSchema,
      parser,
    },
  });
}

function createResolvingClient(
  resolveUser = jest.fn(async () => resolvedUser),
) {
  return new OAuthClient({
    provider: "github",
    clientId: "client-id",
    clientSecret: "client-secret",
    scopes: ["read:user"],
    urls: {
      auth: authUrl,
      token: tokenUrl,
      user: userUrl,
    },
    userInfo: {
      schema: userSchema,
      resolveUser,
    },
  });
}

function createGithubFixtureClient(): ReturnType<
  typeof createGithubOAuthClient
> {
  return new OAuthClient({
    provider: "github",
    clientId: "client-id",
    clientSecret: "client-secret",
    scopes: ["user:email", "read:user"],
    urls: {
      auth: authUrl,
      token: tokenUrl,
      user: userUrl,
    },
    userInfo: {
      schema: z.object({
        id: z.number(),
        name: z.string().nullable(),
        login: z.string(),
        email: z.string().email().nullable(),
      }),
      resolveUser: async () => resolvedUser,
    },
  });
}

function createGoogleFixtureClient(): ReturnType<
  typeof createGoogleOAuthClient
> {
  return new OAuthClient({
    provider: "google",
    clientId: "client-id",
    clientSecret: "client-secret",
    scopes: ["openid", "email", "profile"],
    urls: {
      auth: authUrl,
      token: tokenUrl,
      user: userUrl,
    },
    userInfo: {
      schema: z.object({
        sub: z.string(),
        email: z.string().email(),
        name: z.string(),
        email_verified: z.boolean().optional(),
      }),
      parser: () => resolvedUser,
    },
  });
}

function createDiscordFixtureClient(): ReturnType<
  typeof createDiscordOAuthClient
> {
  return new OAuthClient({
    provider: "discord",
    clientId: "client-id",
    clientSecret: "client-secret",
    scopes: ["identify", "email"],
    urls: {
      auth: authUrl,
      token: tokenUrl,
      user: userUrl,
    },
    userInfo: {
      schema: z.object({
        id: z.string(),
        username: z.string(),
        global_name: z.string().nullable(),
        email: z.unknown().optional(),
        verified: z.boolean().optional(),
      }),
      resolveUser: async () => resolvedUser,
    },
  });
}

function createCookieStore(values: Record<string, string> = {}) {
  const store = {
    set: jest.fn(),
    get: jest.fn((key: string) => {
      const value = values[key];
      return value === undefined ? undefined : { name: key, value };
    }),
    delete: jest.fn(),
  } satisfies Cookies;

  return store;
}

function mockSuccessfulFetches() {
  const fetchMock = jest.mocked(fetch);

  fetchMock
    .mockResolvedValueOnce(
      Response.json({
        access_token: "access-token",
        token_type: "Bearer",
      }),
    )
    .mockResolvedValueOnce(Response.json(userPayload));

  return fetchMock;
}

function expectTokenRequest(
  fetchMock: jest.MockedFunction<typeof fetch>,
  codeVerifier: string,
) {
  expect(fetchMock).toHaveBeenNthCalledWith(
    1,
    tokenUrl,
    expect.objectContaining({
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: expect.any(String),
    }),
  );

  const [, init] = fetchMock.mock.calls[0];
  const body = new URLSearchParams(init?.body?.toString());

  expect(Object.fromEntries(body)).toEqual({
    code: "oauth-code",
    client_id: "client-id",
    client_secret: "client-secret",
    redirect_uri: "http://localhost:3000/api/oauth/github",
    grant_type: "authorization_code",
    code_verifier: codeVerifier,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

describe("getOAuthClient", () => {
  const credentials = {
    clientId: "client-id",
    clientSecret: "client-secret",
  };

  it("throws when the provider is not configured", () => {
    mockGetOAuthConfig.mockReturnValue(null);

    expect(() => getOAuthClient("github")).toThrow(OAuthNotConfiguredError);
    expect(mockCreateGithubOAuthClient).not.toHaveBeenCalled();
  });

  it("throws for an unsupported provider at the runtime boundary", () => {
    const unsupportedProvider = "linkedin" as Parameters<
      typeof getOAuthClient
    >[0];

    mockGetOAuthConfig.mockReturnValue(credentials);

    expect(() => getOAuthClient(unsupportedProvider)).toThrow(
      "Unsupported provider: linkedin",
    );
  });

  it("delegates configured providers to their client factories", () => {
    const githubClient = createGithubFixtureClient();
    const googleClient = createGoogleFixtureClient();
    const discordClient = createDiscordFixtureClient();

    mockGetOAuthConfig.mockReturnValue(credentials);
    mockCreateGithubOAuthClient.mockReturnValue(githubClient);
    mockCreateGoogleOAuthClient.mockReturnValue(googleClient);
    mockCreateDiscordOAuthClient.mockReturnValue(discordClient);

    expect(getOAuthClient("github")).toBe(githubClient);
    expect(getOAuthClient("google")).toBe(googleClient);
    expect(getOAuthClient("discord")).toBe(discordClient);
    expect(mockCreateGithubOAuthClient).toHaveBeenCalledWith(credentials);
    expect(mockCreateGoogleOAuthClient).toHaveBeenCalledWith(credentials);
    expect(mockCreateDiscordOAuthClient).toHaveBeenCalledWith(credentials);
  });
});

describe("OAuthClient.createAuthUrl", () => {
  it("stores state and code verifier cookies and returns PKCE auth params", () => {
    jest
      .useFakeTimers()
      .setSystemTime(new Date("2026-05-25T12:00:00.000Z").getTime());

    try {
      const cookies = createCookieStore();

      const redirect = createClient().createAuthUrl(cookies);

      const url = new URL(redirect);
      const [stateCookie, verifierCookie] = cookies.set.mock.calls;
      const [, state, stateOptions] = stateCookie;
      const [, codeVerifier, verifierOptions] = verifierCookie;

      expect(url.origin + url.pathname).toBe(authUrl);
      expect(url.searchParams.get("client_id")).toBe("client-id");
      expect(url.searchParams.get("redirect_uri")).toBe(
        "http://localhost:3000/api/oauth/github",
      );
      expect(url.searchParams.get("response_type")).toBe("code");
      expect(url.searchParams.get("scope")).toBe("read:user user:email");
      expect(url.searchParams.get("state")).toBe(state);
      expect(url.searchParams.get("code_challenge")).toBe(
        crypto.hash("sha256", codeVerifier, "base64url"),
      );
      expect(url.searchParams.get("code_challenge_method")).toBe("S256");
      expect(cookies.set).toHaveBeenCalledWith("__Host-oauth_state", state, {
        secure: true,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        expires: Date.now() + 600_000,
      });
      expect(cookies.set).toHaveBeenCalledWith(
        "__Host-oauth_code_verifier",
        codeVerifier,
        {
          secure: true,
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          expires: Date.now() + 600_000,
        },
      );
      expect(stateOptions).toEqual(verifierOptions);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("OAuthClient.fetchUser", () => {
  it("rejects callbacks with an invalid state before fetching tokens", async () => {
    const cookies = createCookieStore({
      "__Host-oauth_state": "stored-state",
      "__Host-oauth_code_verifier": "code-verifier",
    });

    await expect(
      createClient().fetchUser("oauth-code", "tampered-state", cookies),
    ).rejects.toBeInstanceOf(InvalidStateError);

    expect(fetch).not.toHaveBeenCalled();
    expect(cookies.delete).toHaveBeenCalledWith("__Host-oauth_state");
    expect(cookies.delete).toHaveBeenCalledWith("__Host-oauth_code_verifier");
  });

  it("rejects callbacks with no stored code verifier before fetching tokens", async () => {
    const cookies = createCookieStore({
      "__Host-oauth_state": "stored-state",
    });

    await expect(
      createClient().fetchUser("oauth-code", "stored-state", cookies),
    ).rejects.toBeInstanceOf(InvalidCodeVerifierError);

    expect(fetch).not.toHaveBeenCalled();
    expect(cookies.delete).toHaveBeenCalledWith("__Host-oauth_state");
    expect(cookies.delete).toHaveBeenCalledWith("__Host-oauth_code_verifier");
  });

  it("exchanges the code and parses the resolved OAuth user", async () => {
    const fetchMock = mockSuccessfulFetches();
    const cookies = createCookieStore({
      "__Host-oauth_state": "stored-state",
      "__Host-oauth_code_verifier": "code-verifier",
    });

    await expect(
      createClient().fetchUser("oauth-code", "stored-state", cookies),
    ).resolves.toEqual(resolvedUser);

    expectTokenRequest(fetchMock, "code-verifier");
    expect(fetchMock).toHaveBeenNthCalledWith(2, userUrl, {
      headers: {
        Authorization: "Bearer access-token",
      },
    });
    expect(parser).toHaveBeenCalledWith(userPayload);
    expect(cookies.delete).toHaveBeenCalledWith("__Host-oauth_state");
    expect(cookies.delete).toHaveBeenCalledWith("__Host-oauth_code_verifier");
  });

  it("passes parsed user data and token details to resolver-based clients", async () => {
    const fetchMock = mockSuccessfulFetches();
    const resolveUser = jest.fn(async () => resolvedUser);
    const cookies = createCookieStore({
      "__Host-oauth_state": "stored-state",
      "__Host-oauth_code_verifier": "code-verifier",
    });

    await expect(
      createResolvingClient(resolveUser).fetchUser(
        "oauth-code",
        "stored-state",
        cookies,
      ),
    ).resolves.toEqual(resolvedUser);

    expectTokenRequest(fetchMock, "code-verifier");
    expect(resolveUser).toHaveBeenCalledWith({
      data: userPayload,
      accessToken: "access-token",
      tokenType: "Bearer",
    });
  });

  it("throws InvalidTokenError when the token endpoint rejects the code", async () => {
    jest
      .mocked(fetch)
      .mockResolvedValueOnce(
        new Response("invalid grant", { status: 400, statusText: "Bad" }),
      );
    const cookies = createCookieStore({
      "__Host-oauth_state": "stored-state",
      "__Host-oauth_code_verifier": "code-verifier",
    });

    await expect(
      createClient().fetchUser("oauth-code", "stored-state", cookies),
    ).rejects.toMatchObject({
      name: "InvalidTokenError",
      status: 400,
      statusText: "Bad",
      bodyPreview: "invalid grant",
    });
  });

  it("truncates long HTTP error response bodies", async () => {
    jest.mocked(fetch).mockResolvedValueOnce(
      new Response("x".repeat(600), {
        status: 400,
        statusText: "Bad",
      }),
    );
    const cookies = createCookieStore({
      "__Host-oauth_state": "stored-state",
      "__Host-oauth_code_verifier": "code-verifier",
    });

    await expect(
      createClient().fetchUser("oauth-code", "stored-state", cookies),
    ).rejects.toMatchObject({
      name: "InvalidTokenError",
      status: 400,
      statusText: "Bad",
      bodyPreview: expect.stringMatching(
        new RegExp(`^x{${maxHttpErrorBodyPreviewLength}}.$`),
      ),
    });
  });

  it("throws InvalidTokenError when the token payload is malformed", async () => {
    jest.mocked(fetch).mockResolvedValueOnce(Response.json({ token: "bad" }));
    const cookies = createCookieStore({
      "__Host-oauth_state": "stored-state",
      "__Host-oauth_code_verifier": "code-verifier",
    });

    await expect(
      createClient().fetchUser("oauth-code", "stored-state", cookies),
    ).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it("wraps unexpected token exchange failures", async () => {
    const cause = new Error("network unavailable");

    jest.mocked(fetch).mockRejectedValueOnce(cause);
    const cookies = createCookieStore({
      "__Host-oauth_state": "stored-state",
      "__Host-oauth_code_verifier": "code-verifier",
    });

    await expect(
      createClient().fetchUser("oauth-code", "stored-state", cookies),
    ).rejects.toMatchObject({
      message: "Failed to fetch token",
      cause,
    });
  });

  it("throws OAuthUserInfoHttpError when the user endpoint fails", async () => {
    jest
      .mocked(fetch)
      .mockResolvedValueOnce(
        Response.json({ access_token: "access-token", token_type: "Bearer" }),
      )
      .mockResolvedValueOnce(
        new Response("profile unavailable", {
          status: 503,
          statusText: "Unavailable",
        }),
      );
    const cookies = createCookieStore({
      "__Host-oauth_state": "stored-state",
      "__Host-oauth_code_verifier": "code-verifier",
    });

    await expect(
      createClient().fetchUser("oauth-code", "stored-state", cookies),
    ).rejects.toMatchObject({
      name: "OAuthUserInfoHttpError",
      status: 503,
      statusText: "Unavailable",
      bodyPreview: "profile unavailable",
    });
  });

  it("throws InvalidUserError when the user payload is malformed", async () => {
    jest
      .mocked(fetch)
      .mockResolvedValueOnce(
        Response.json({ access_token: "access-token", token_type: "Bearer" }),
      )
      .mockResolvedValueOnce(Response.json({ id: "missing-email" }));
    const cookies = createCookieStore({
      "__Host-oauth_state": "stored-state",
      "__Host-oauth_code_verifier": "code-verifier",
    });

    await expect(
      createClient().fetchUser("oauth-code", "stored-state", cookies),
    ).rejects.toBeInstanceOf(InvalidUserError);
  });

  it("wraps unexpected user fetch failures", async () => {
    const cause = new Error("profile response was not JSON");

    jest
      .mocked(fetch)
      .mockResolvedValueOnce(
        Response.json({ access_token: "access-token", token_type: "Bearer" }),
      )
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockRejectedValue(cause),
      } as unknown as Response);
    const cookies = createCookieStore({
      "__Host-oauth_state": "stored-state",
      "__Host-oauth_code_verifier": "code-verifier",
    });

    await expect(
      createClient().fetchUser("oauth-code", "stored-state", cookies),
    ).rejects.toMatchObject({
      message: "Failed to fetch user",
      cause,
    });
  });
});
