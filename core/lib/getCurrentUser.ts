import { cache } from "react";

import type { AuthUser } from "@/core/features/auth/types";
import { getUserService } from "@/core/features/users/service";

import { getSessionToken } from "@/core/features/auth/cookies";
import { extendSessionIfNeeded } from "@/core/features/auth/session";

export const getCurrentUser = cache(
  async function getCurrentUser(): Promise<AuthUser | null> {
    const token = await getSessionToken();

    if (!token) {
      return null;
    }

    const session = await extendSessionIfNeeded(token);

    if (!session) {
      return null;
    }

    const user = await getUserService(session.userId);

    return user ?? null;
  },
);
