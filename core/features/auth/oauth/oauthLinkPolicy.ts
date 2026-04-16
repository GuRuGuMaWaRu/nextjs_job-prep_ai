import type { OAuthProvider } from "@/core/drizzle/schema/oauthProviderIds";

import { OAuthUnverifiedEmailError } from "./errors";

/**
 * Ensures we do not merge an OAuth login into an existing account by email when the IdP email is unverified.
 */
export function assertOAuthEmailLinkAllowed(
  oAuthUser: { emailVerified: boolean },
  existingByEmail: { id: string } | null,
  provider: OAuthProvider,
): void {
  if (existingByEmail != null && !oAuthUser.emailVerified) {
    throw new OAuthUnverifiedEmailError(provider);
  }
}
