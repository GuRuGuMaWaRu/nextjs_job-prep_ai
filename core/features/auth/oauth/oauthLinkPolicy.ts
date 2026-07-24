import type { OAuthProvider } from "@/core/drizzle/schema/oauthProviderIds";

import {
  OAuthUnverifiedAccountLinkError,
  OAuthUnverifiedEmailError,
} from "./errors";

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

/**
 * Ensures email-based OAuth linking only targets accounts that already proved email ownership.
 *
 * Password signup creates usable rows with `emailVerified: null`. Auto-linking a verified IdP
 * identity into those rows would let an attacker who registered the victim's email take over
 * the victim's subsequent OAuth sign-in.
 */
export function assertLocalAccountVerifiedForEmailLink(
  existingUser: { emailVerified: Date | null },
  provider: OAuthProvider,
): void {
  if (existingUser.emailVerified == null) {
    throw new OAuthUnverifiedAccountLinkError(provider);
  }
}
