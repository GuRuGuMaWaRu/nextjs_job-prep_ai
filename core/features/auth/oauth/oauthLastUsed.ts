import { cookies } from "next/headers";
import z from "zod";

import { COOKIE_OPTIONS } from "@/core/features/auth/constants";
import {
  oAuthProviders,
  type OAuthProvider,
} from "@/core/drizzle/schema/userOAuthAccount";

/** UX hint only; not used for authorization. */
export const OAUTH_LAST_USED_COOKIE_KEY = "oauth_last_used";

const OAUTH_LAST_USED_MAX_AGE_MS = 400 * 24 * 60 * 60 * 1000;

const oauthProviderSchema = z.enum(oAuthProviders);

/**
 * Parses a raw cookie value into an allowlisted OAuth provider, or undefined.
 */
export function parseOAuthLastUsedCookieValue(
  raw: string | undefined,
): OAuthProvider | undefined {
  if (raw == null || raw === "") {
    return undefined;
  }

  const parsed = oauthProviderSchema.safeParse(raw);
  if (!parsed.success) {
    return undefined;
  }

  return parsed.data;
}

/**
 * Persists which OAuth provider the user last signed in with (successful callback only).
 */
export async function setLastUsedOAuthProviderCookie(
  provider: OAuthProvider,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_LAST_USED_COOKIE_KEY, provider, {
    ...COOKIE_OPTIONS,
    expires: new Date(Date.now() + OAUTH_LAST_USED_MAX_AGE_MS),
  });
}

/**
 * Reads the last-used OAuth provider cookie for auth page UI.
 */
export async function getLastUsedOAuthProvider(): Promise<
  OAuthProvider | undefined
> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(OAUTH_LAST_USED_COOKIE_KEY)?.value;

  return parseOAuthLastUsedCookieValue(raw);
}
