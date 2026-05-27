jest.mock("@/core/data/env/server", () => ({
  env: {
    OAUTH_REDIRECT_URL_BASE: "http://localhost:3000",
  },
}));

import {
  createGithubOAuthClient,
  selectGithubEmailFromVerifiedList,
} from "@/core/features/auth/oauth/github";
import { OAuthNoVerifiedEmailError } from "@/core/features/auth/oauth/errors";
import type { Cookies } from "@/core/features/auth/oauth/types";

function createCookieStore(values: Record<string, string> = {}) {
  const store = {
    get: jest.fn((key: string) => {
      const value = values[key];
      return value === undefined ? undefined : { name: key, value };
    }),
    delete: jest.fn(),
    set: jest.fn(),
  } satisfies Cookies;

  return store;
}

function createCallbackCookieStore() {
  return createCookieStore({
    "__Host-oauth_state": "stored-state",
    "__Host-oauth_code_verifier": "code-verifier",
  });
}

function createClient() {
  return createGithubOAuthClient({
    clientId: "github-client-id",
    clientSecret: "github-client-secret",
  });
}

function mockTokenAndGithubUser() {
  return jest
    .mocked(fetch)
    .mockResolvedValueOnce(
      Response.json({
        access_token: "github-access-token",
        token_type: "Bearer",
      }),
    )
    .mockResolvedValueOnce(
      Response.json({
        id: 123456,
        name: null,
        login: "octo-candidate",
        email: null,
      }),
    );
}

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

describe("selectGithubEmailFromVerifiedList", () => {
  it("prefers primary and verified", () => {
    expect(
      selectGithubEmailFromVerifiedList([
        { email: "secondary@x.com", primary: false, verified: true },
        { email: "primary@x.com", primary: true, verified: true },
      ]),
    ).toBe("primary@x.com");
  });

  it("falls back to first verified when no primary verified", () => {
    expect(
      selectGithubEmailFromVerifiedList([
        { email: "a@x.com", primary: true, verified: false },
        { email: "b@x.com", primary: false, verified: true },
      ]),
    ).toBe("b@x.com");
  });

  it("returns null when no verified email exists", () => {
    expect(
      selectGithubEmailFromVerifiedList([
        { email: "a@x.com", primary: true, verified: false },
        { email: "b@x.com", primary: false, verified: false },
      ]),
    ).toBeNull();
  });

  it("lowercases the chosen email", () => {
    expect(
      selectGithubEmailFromVerifiedList([
        { email: "User@Example.COM", primary: true, verified: true },
      ]),
    ).toBe("user@example.com");
  });
});

describe("createGithubOAuthClient", () => {
  it("resolves a GitHub user from the verified emails endpoint", async () => {
    const fetchMock = mockTokenAndGithubUser().mockResolvedValueOnce(
      Response.json([
        {
          email: "secondary@test.local",
          primary: false,
          verified: true,
        },
        {
          email: "Primary@Test.Local",
          primary: true,
          verified: true,
        },
      ]),
    );
    const cookies = createCallbackCookieStore();

    await expect(
      createClient().fetchUser("oauth-code", "stored-state", cookies),
    ).resolves.toEqual({
      id: "123456",
      email: "primary@test.local",
      name: "octo-candidate",
      emailVerified: true,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "https://api.github.com/user/emails",
      {
        headers: {
          Authorization: "Bearer github-access-token",
          Accept: "application/vnd.github+json",
        },
      },
    );
    expect(cookies.delete).toHaveBeenCalledWith("__Host-oauth_state");
    expect(cookies.delete).toHaveBeenCalledWith("__Host-oauth_code_verifier");
  });

  it("rejects invalid GitHub email payloads with wrapped resolver context", async () => {
    const fetchMock = mockTokenAndGithubUser().mockResolvedValueOnce(
      Response.json([{ email: "not-an-email", primary: true, verified: true }]),
    );
    const cookies = createCallbackCookieStore();

    await expect(
      createClient().fetchUser("oauth-code", "stored-state", cookies),
    ).rejects.toMatchObject({
      message: "Failed to fetch user",
      cause: expect.objectContaining({
        message: "Failed to fetch GitHub user emails",
      }),
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(cookies.delete).toHaveBeenCalledWith("__Host-oauth_state");
    expect(cookies.delete).toHaveBeenCalledWith("__Host-oauth_code_verifier");
  });

  it("throws OAuthNoVerifiedEmailError when GitHub has no verified emails", async () => {
    mockTokenAndGithubUser().mockResolvedValueOnce(
      Response.json([
        {
          email: "unverified@test.local",
          primary: true,
          verified: false,
        },
      ]),
    );
    const cookies = createCallbackCookieStore();

    await expect(
      createClient().fetchUser("oauth-code", "stored-state", cookies),
    ).rejects.toMatchObject({
      cause: expect.any(OAuthNoVerifiedEmailError),
    });

    expect(cookies.delete).toHaveBeenCalledWith("__Host-oauth_state");
    expect(cookies.delete).toHaveBeenCalledWith("__Host-oauth_code_verifier");
  });

  it("wraps GitHub email endpoint fetch failures", async () => {
    const cause = new Error("GitHub emails unavailable");

    mockTokenAndGithubUser().mockRejectedValueOnce(cause);
    const cookies = createCallbackCookieStore();

    await expect(
      createClient().fetchUser("oauth-code", "stored-state", cookies),
    ).rejects.toMatchObject({
      message: "Failed to fetch user",
      cause: expect.objectContaining({
        message: "Failed to fetch GitHub user emails",
        cause,
      }),
    });

    expect(cookies.delete).toHaveBeenCalledWith("__Host-oauth_state");
    expect(cookies.delete).toHaveBeenCalledWith("__Host-oauth_code_verifier");
  });
});
