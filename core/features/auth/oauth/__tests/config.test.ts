import type { OAuthProvider } from "@/core/drizzle/schema/oauthProviderIds";

const mockEnv: {
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
} = {};

jest.mock("@/core/data/env/server", () => ({
  get env() {
    return mockEnv;
  },
}));

import {
  getConfiguredOAuthProviders,
  getOAuthConfig,
} from "@/core/features/auth/oauth/config";

describe("getOAuthConfig", () => {
  beforeEach(() => {
    mockEnv.DISCORD_CLIENT_ID = undefined;
    mockEnv.DISCORD_CLIENT_SECRET = undefined;
    mockEnv.GOOGLE_CLIENT_ID = undefined;
    mockEnv.GOOGLE_CLIENT_SECRET = undefined;
    mockEnv.GITHUB_CLIENT_ID = undefined;
    mockEnv.GITHUB_CLIENT_SECRET = undefined;
  });

  it("returns null when client id is missing", () => {
    mockEnv.GOOGLE_CLIENT_SECRET = "secret";

    expect(getOAuthConfig("google")).toBeNull();
  });

  it("returns null when client secret is missing", () => {
    mockEnv.GOOGLE_CLIENT_ID = "id";

    expect(getOAuthConfig("google")).toBeNull();
  });

  it("returns credentials when both id and secret are set", () => {
    mockEnv.GOOGLE_CLIENT_ID = "client-id";
    mockEnv.GOOGLE_CLIENT_SECRET = "client-secret";

    expect(getOAuthConfig("google")).toEqual({
      clientId: "client-id",
      clientSecret: "client-secret",
    });
  });

  it("returns Discord credentials from Discord env values", () => {
    mockEnv.DISCORD_CLIENT_ID = "discord-client-id";
    mockEnv.DISCORD_CLIENT_SECRET = "discord-client-secret";

    expect(getOAuthConfig("discord")).toEqual({
      clientId: "discord-client-id",
      clientSecret: "discord-client-secret",
    });
  });

  it("returns GitHub credentials from GitHub env values", () => {
    mockEnv.GITHUB_CLIENT_ID = "github-client-id";
    mockEnv.GITHUB_CLIENT_SECRET = "github-client-secret";

    expect(getOAuthConfig("github")).toEqual({
      clientId: "github-client-id",
      clientSecret: "github-client-secret",
    });
  });

  it("returns null for empty string credentials", () => {
    mockEnv.GOOGLE_CLIENT_ID = "";
    mockEnv.GOOGLE_CLIENT_SECRET = "x";

    expect(getOAuthConfig("google")).toBeNull();
  });

  it("returns null for empty string secrets", () => {
    mockEnv.DISCORD_CLIENT_ID = "discord-client-id";
    mockEnv.DISCORD_CLIENT_SECRET = "";

    expect(getOAuthConfig("discord")).toBeNull();
  });

  it("throws when given an unsupported provider at runtime", () => {
    expect(() => getOAuthConfig("slack" as OAuthProvider)).toThrow(
      "Unexpected: slack",
    );
  });
});

describe("getConfiguredOAuthProviders", () => {
  beforeEach(() => {
    mockEnv.DISCORD_CLIENT_ID = undefined;
    mockEnv.DISCORD_CLIENT_SECRET = undefined;
    mockEnv.GOOGLE_CLIENT_ID = undefined;
    mockEnv.GOOGLE_CLIENT_SECRET = undefined;
    mockEnv.GITHUB_CLIENT_ID = undefined;
    mockEnv.GITHUB_CLIENT_SECRET = undefined;
  });

  it("returns only providers with complete credentials", () => {
    mockEnv.DISCORD_CLIENT_ID = "discord-id";
    mockEnv.GITHUB_CLIENT_ID = "gh-id";
    mockEnv.GITHUB_CLIENT_SECRET = "gh-secret";
    mockEnv.GOOGLE_CLIENT_ID = "g-id";
    mockEnv.GOOGLE_CLIENT_SECRET = "g-secret";

    expect(getConfiguredOAuthProviders()).toEqual([
      "google",
      "github",
    ] satisfies OAuthProvider[]);
  });

  it("returns empty array when no provider is configured", () => {
    expect(getConfiguredOAuthProviders()).toEqual([]);
  });
});
