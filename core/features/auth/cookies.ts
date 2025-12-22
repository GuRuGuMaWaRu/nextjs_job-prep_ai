import { cookies } from "next/headers";

import {
  SESSION_COOKIE_NAME,
  COOKIE_OPTIONS,
} from "@/core/features/auth/constants";

/**
 * Set session cookie
 * @param token - Session token to store
 * @param expiresAt - Expiration date
 */
export async function setSessionCookie(
  token: string,
  expiresAt: Date
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    ...COOKIE_OPTIONS,
    expires: expiresAt,
  });
}

/**
 * Get session token from cookie
 * @returns Session token or null if not found
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  return cookie?.value ?? null;
}

/**
 * Delete session cookie (logout)
 */
export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
