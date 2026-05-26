import type { OAuthProvider } from "@/core/drizzle/schema/oauthProviderIds";

import { OAuthUnverifiedEmailError } from "./errors";

/**
 * Ensures OAuth email addresses are verified before using them for account ownership.
 */
export function assertOAuthEmailLinkAllowed(
  oAuthUser: { emailVerified: boolean },
  provider: OAuthProvider,
): void {
  if (!oAuthUser.emailVerified) {
    throw new OAuthUnverifiedEmailError(provider);
  }
}
