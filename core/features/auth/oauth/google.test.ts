jest.mock("@/core/data/env/server", () => ({
  env: {
    OAUTH_REDIRECT_URL_BASE: "http://localhost:3000",
  },
}));

import {
  createGoogleOAuthClient,
  googleOAuthUserInfoSchema,
  mapGoogleUserToResolved,
} from "@/core/features/auth/oauth/google";
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
  return createGoogleOAuthClient({
    clientId: "google-client-id",
    clientSecret: "google-client-secret",
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

describe("mapGoogleUserToResolved", () => {
  it("accepts a valid Google userinfo payload", () => {
    const result = googleOAuthUserInfoSchema.safeParse({
      sub: "sub-id",
      email: "candidate@test.local",
      name: "Test Candidate",
      email_verified: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejects malformed Google userinfo payloads", () => {
    const result = googleOAuthUserInfoSchema.safeParse({
      sub: "sub-id",
      email: "not-an-email",
      name: "Test Candidate",
      email_verified: true,
    });

    expect(result.success).toBe(false);
  });

  it("rejects Google payloads with non-boolean email verification", () => {
    const result = googleOAuthUserInfoSchema.safeParse({
      sub: "sub-id",
      email: "candidate@test.local",
      name: "Test Candidate",
      email_verified: "true",
    });

    expect(result.success).toBe(false);
  });

  it("maps email_verified true to emailVerified true", () => {
    expect(
      mapGoogleUserToResolved({
        sub: "sub-id",
        email: "candidate@test.local",
        name: "A",
        email_verified: true,
      }),
    ).toEqual({
      id: "sub-id",
      email: "candidate@test.local",
      name: "A",
      emailVerified: true,
    });
  });

  it("maps missing email_verified to emailVerified false", () => {
    expect(
      mapGoogleUserToResolved({
        sub: "sub-id",
        email: "candidate@test.local",
        name: "A",
      }),
    ).toMatchObject({
      emailVerified: false,
    });
  });

  it("maps email_verified false to emailVerified false", () => {
    expect(
      mapGoogleUserToResolved({
        sub: "sub-id",
        email: "candidate@test.local",
        name: "A",
        email_verified: false,
      }),
    ).toMatchObject({
      emailVerified: false,
    });
  });
});

describe("createGoogleOAuthClient", () => {
  it("creates a Google authorization URL with provider scopes", () => {
    const cookies = createCookieStore();

    const redirect = createClient().createAuthUrl(cookies);

    const url = new URL(redirect);
    const [, state] = cookies.set.mock.calls[0];

    expect(url.origin + url.pathname).toBe(
      "https://accounts.google.com/o/oauth2/auth",
    );
    expect(url.searchParams.get("client_id")).toBe("google-client-id");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/google",
    );
    expect(url.searchParams.get("scope")).toBe("profile email");
    expect(url.searchParams.get("state")).toBe(state);
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(cookies.set).toHaveBeenCalledWith(
      "__Host-oauth_code_verifier",
      expect.any(String),
      expect.objectContaining({
        secure: true,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      }),
    );
  });

  it("fetches and maps a Google user through the provider endpoints", async () => {
    const fetchMock = jest
      .mocked(fetch)
      .mockResolvedValueOnce(
        Response.json({
          access_token: "google-access-token",
          token_type: "Bearer",
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          sub: "google-user-id",
          email: "candidate@test.local",
          name: "Test Candidate",
          email_verified: true,
        }),
      );
    const cookies = createCallbackCookieStore();

    await expect(
      createClient().fetchUser("oauth-code", "stored-state", cookies),
    ).resolves.toEqual({
      id: "google-user-id",
      email: "candidate@test.local",
      name: "Test Candidate",
      emailVerified: true,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: "Bearer google-access-token",
        },
      },
    );
    expect(cookies.delete).toHaveBeenCalledWith("__Host-oauth_state");
    expect(cookies.delete).toHaveBeenCalledWith("__Host-oauth_code_verifier");
  });
});
