import { redirect } from "next/navigation";

import { getSessionToken } from "@/core/features/auth/cookies";
import { extendSessionIfNeeded } from "@/core/features/auth/session";
import { getUser } from "@/core/features/users/actions";
import { routes } from "@/core/data/routes";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  passwordHash: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CurrentUser = {
  userId: string | null;
  user?: AuthUser;
  redirectToSignIn: () => never;
};

/**
 * Get the current authenticated user from session
 * This replaces Clerk's getCurrentUser function
 *
 * @param options.allData - Whether to fetch full user data from database
 * @returns Object with userId, optional user data, and redirectToSignIn helper
 */
export async function getCurrentUser({
  allData = false,
}: { allData?: boolean } = {}): Promise<CurrentUser> {
  const token = await getSessionToken();

  if (!token) {
    return {
      userId: null,
      redirectToSignIn: () => redirect(routes.signIn),
    };
  }

  // Validate and potentially extend the session
  const session = await extendSessionIfNeeded(token);

  if (!session) {
    return {
      userId: null,
      redirectToSignIn: () => redirect(routes.signIn),
    };
  }

  const userId = session.userId;

  return {
    userId,
    user: allData ? (await getUser(userId)) ?? undefined : undefined,
    redirectToSignIn: () => redirect(routes.signIn),
  };
}
