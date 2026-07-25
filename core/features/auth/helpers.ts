import { cache } from "react";
import { redirect } from "next/navigation";

import { routes } from "@/core/data/routes";
import { getUserAction } from "@/core/features/users/actions";
import type { AuthUser } from "@/core/features/auth/types";

import { deleteSessionCookie, getSessionToken } from "./cookies";
import { getSessionByToken, extendSessionIfNeeded } from "./session";

export async function validateSessionAndClearCookie(
  token: string,
): Promise<boolean> {
  try {
    const session = await getSessionByToken(token);

    if (!session) {
      await deleteSessionCookie();

      return false;
    }

    return true;
  } catch (error) {
    console.error("Session validation error:", error);
    return false;
  }
}

const getActiveSession = cache(async () => {
  const token = await getSessionToken();

  if (!token) {
    return null;
  }

  return extendSessionIfNeeded(token);
});

export const getCurrentUser = cache(async function getCurrentUser(): Promise<{
  user: AuthUser | null;
}> {
  try {
    const session = await getActiveSession();

    if (!session) {
      return { user: null };
    }

    const user = await getUserAction(session.userId);

    return { user: user ?? null };
  } catch (error) {
    console.error("getCurrentUser: session or user load failed:", error);
    return { user: null };
  }
});

export async function requireCurrentUser(): Promise<AuthUser> {
  const { user } = await getCurrentUser();

  if (!user) {
    return redirect(routes.signIn);
  }

  return user;
}
