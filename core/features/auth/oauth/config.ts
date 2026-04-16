import { env } from "@/core/data/env/server";
import type { OAuthProvider } from "@/core/drizzle/schema/userOAuthAccount";

/**
 * Must match `oAuthProviders` in `@/core/drizzle/schema/userOAuthAccount` (avoid importing Drizzle here).
 */
const ALL_OAUTH_PROVIDERS: readonly OAuthProvider[] = [
  "google",
  "github",
  "discord",
];

export type OAuthProviderCredentials = {
  clientId: string;
  clientSecret: string;
};

function isNonEmptyString(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}

function assertNever(x: never): never {
  throw new Error(`Unexpected: ${x}`);
}

/**
 * Returns OAuth client credentials for the provider when both id and secret are set.
 */
export function getOAuthConfig(
  provider: OAuthProvider,
): OAuthProviderCredentials | null {
  switch (provider) {
    case "discord": {
      const clientId = env.DISCORD_CLIENT_ID;
      const clientSecret = env.DISCORD_CLIENT_SECRET;

      if (!isNonEmptyString(clientId) || !isNonEmptyString(clientSecret)) {
        return null;
      }

      return { clientId, clientSecret };
    }

    case "google": {
      const clientId = env.GOOGLE_CLIENT_ID;
      const clientSecret = env.GOOGLE_CLIENT_SECRET;

      if (!isNonEmptyString(clientId) || !isNonEmptyString(clientSecret)) {
        return null;
      }

      return { clientId, clientSecret };
    }

    case "github": {
      const clientId = env.GITHUB_CLIENT_ID;
      const clientSecret = env.GITHUB_CLIENT_SECRET;

      if (!isNonEmptyString(clientId) || !isNonEmptyString(clientSecret)) {
        return null;
      }

      return { clientId, clientSecret };
    }

    default: {
      return assertNever(provider);
    }
  }
}

/**
 * Lists OAuth providers that have both client id and secret configured.
 */
export function getConfiguredOAuthProviders(): OAuthProvider[] {
  return ALL_OAUTH_PROVIDERS.filter((p) => getOAuthConfig(p) !== null);
}
