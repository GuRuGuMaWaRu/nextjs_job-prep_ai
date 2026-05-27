jest.mock("@/core/data/env/server", () => ({
  env: {
    OAUTH_REDIRECT_URL_BASE: "http://localhost:3000",
  },
}));

import {
  createDiscordOAuthClient,
  discordUserSchema,
  resolveDiscordOAuthUser,
} from "@/core/features/auth/oauth/discord";
import { OAuthMissingEmailError } from "@/core/features/auth/oauth/errors";
import type { Cookies } from "@/core/features/auth/oauth/types";

const basePayload = {
  id: "80351110224678912",
  username: "Nelly",
  global_name: null as string | null,
};

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
  return createDiscordOAuthClient({
    clientId: "discord-client-id",
    clientSecret: "discord-client-secret",
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

describe("discordUserSchema", () => {
  it("accepts payload without email field", () => {
    const result = discordUserSchema.safeParse({ ...basePayload });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBeUndefined();
    }
  });

  it("accepts email null", () => {
    const result = discordUserSchema.safeParse({
      ...basePayload,
      email: null,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBeNull();
    }
  });

  it("accepts valid email", () => {
    const result = discordUserSchema.safeParse({
      ...basePayload,
      email: "candidate@test.local",
    });

    expect(result.success).toBe(true);
  });

  it("maps empty string email to null via preprocess", () => {
    const result = discordUserSchema.safeParse({
      ...basePayload,
      email: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBeNull();
    }
  });
});

describe("resolveDiscordOAuthUser", () => {
  it("throws OAuthMissingEmailError when email is missing", async () => {
    const parsed = discordUserSchema.parse({ ...basePayload });

    await expect(resolveDiscordOAuthUser(parsed)).rejects.toBeInstanceOf(
      OAuthMissingEmailError,
    );
  });

  it("throws OAuthMissingEmailError when email is null", async () => {
    const parsed = discordUserSchema.parse({
      ...basePayload,
      email: null,
    });

    await expect(resolveDiscordOAuthUser(parsed)).rejects.toBeInstanceOf(
      OAuthMissingEmailError,
    );
  });

  it("throws OAuthMissingEmailError when email was empty string (preprocessed to null)", async () => {
    const parsed = discordUserSchema.parse({
      ...basePayload,
      email: "",
    });

    await expect(resolveDiscordOAuthUser(parsed)).rejects.toBeInstanceOf(
      OAuthMissingEmailError,
    );
  });

  it("returns normalized user when email is present", async () => {
    const parsed = discordUserSchema.parse({
      ...basePayload,
      email: "candidate@test.local",
      verified: true,
      global_name: "Display",
    });

    await expect(resolveDiscordOAuthUser(parsed)).resolves.toEqual({
      id: "80351110224678912",
      email: "candidate@test.local",
      name: "Display",
      emailVerified: true,
    });
  });

  it("sets emailVerified false when Discord verified is false", async () => {
    const parsed = discordUserSchema.parse({
      ...basePayload,
      email: "candidate@test.local",
      verified: false,
    });

    await expect(resolveDiscordOAuthUser(parsed)).resolves.toMatchObject({
      emailVerified: false,
    });
  });

  it("uses username when global_name is null", async () => {
    const parsed = discordUserSchema.parse({
      ...basePayload,
      email: "candidate@test.local",
      verified: true,
      global_name: null,
    });

    await expect(resolveDiscordOAuthUser(parsed)).resolves.toMatchObject({
      name: "Nelly",
      emailVerified: true,
    });
  });

  it("lowercases email", async () => {
    const parsed = discordUserSchema.parse({
      ...basePayload,
      email: "Candidate@Test.Local",
      verified: true,
    });

    await expect(resolveDiscordOAuthUser(parsed)).resolves.toMatchObject({
      email: "candidate@test.local",
      emailVerified: true,
    });
  });
});

describe("createDiscordOAuthClient", () => {
  it("creates a Discord authorization URL with provider scopes", () => {
    const cookies = createCookieStore();

    const redirect = createClient().createAuthUrl(cookies);

    const url = new URL(redirect);
    const [, state] = cookies.set.mock.calls[0];

    expect(url.origin + url.pathname).toBe(
      "https://discord.com/oauth2/authorize",
    );
    expect(url.searchParams.get("client_id")).toBe("discord-client-id");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/discord",
    );
    expect(url.searchParams.get("scope")).toBe("identify email");
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

  it("fetches and resolves a Discord user through the provider endpoints", async () => {
    const fetchMock = jest
      .mocked(fetch)
      .mockResolvedValueOnce(
        Response.json({
          access_token: "discord-access-token",
          token_type: "Bearer",
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          ...basePayload,
          email: "Candidate@Test.Local",
          verified: true,
          global_name: "Display",
        }),
      );
    const cookies = createCallbackCookieStore();

    await expect(
      createClient().fetchUser("oauth-code", "stored-state", cookies),
    ).resolves.toEqual({
      id: "80351110224678912",
      email: "candidate@test.local",
      name: "Display",
      emailVerified: true,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://discord.com/api/users/@me",
      {
        headers: {
          Authorization: "Bearer discord-access-token",
        },
      },
    );
    expect(cookies.delete).toHaveBeenCalledWith("__Host-oauth_state");
    expect(cookies.delete).toHaveBeenCalledWith("__Host-oauth_code_verifier");
  });
});
