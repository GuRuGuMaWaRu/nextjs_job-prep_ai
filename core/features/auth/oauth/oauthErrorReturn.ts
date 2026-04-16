import { cookies } from "next/headers";

import { routes } from "@/core/data/routes";

/** Matches OAuth state/code verifier lifetime in `base.ts`. */
const COOKIE_EXPIRATION_MS = 60 * 10 * 1000;

export const OAUTH_ERROR_RETURN_COOKIE_KEY = "oauth_error_return";

export type OAuthErrorReturn = "sign-in" | "sign-up";

/**
 * Maps a stored cookie value to an allowlisted auth path. Unknown values default to sign-in.
 */
export function oauthErrorReturnToPath(raw: string | undefined): string {
  if (raw === "sign-up") {
    return routes.signUp;
  }

  return routes.signIn;
}

/**
 * Sets or clears the short-lived cookie that tells the OAuth callback where to send errors.
 * Call with `"sign-up"` when starting OAuth from the sign-up page; use `"sign-in"` to clear a stale value.
 */
export async function setOAuthErrorReturnForNextOAuth(
  errorReturn: OAuthErrorReturn,
): Promise<void> {
  const cookieStore = await cookies();

  if (errorReturn === "sign-up") {
    cookieStore.set(OAUTH_ERROR_RETURN_COOKIE_KEY, "sign-up", {
      secure: true,
      httpOnly: true,
      sameSite: "lax",
      expires: new Date(Date.now() + COOKIE_EXPIRATION_MS),
    });

    return;
  }

  cookieStore.delete(OAUTH_ERROR_RETURN_COOKIE_KEY);
}

/**
 * Reads the error-return target, removes the cookie, and returns the allowlisted path.
 */
export async function getOAuthErrorReturnPathAndClear(): Promise<string> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(OAUTH_ERROR_RETURN_COOKIE_KEY)?.value;
  cookieStore.delete(OAUTH_ERROR_RETURN_COOKIE_KEY);

  return oauthErrorReturnToPath(raw);
}

export async function clearOAuthErrorReturnCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(OAUTH_ERROR_RETURN_COOKIE_KEY);
}
