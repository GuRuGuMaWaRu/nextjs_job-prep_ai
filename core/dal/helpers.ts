import { getCurrentUser } from "@/core/features/auth/helpers";
import type { AuthUser } from "@/core/features/auth/types";
import { UnauthorizedError } from "@/core/dal/errors";

/**
 * DAL Helper Functions
 */

/**
 * Require authenticated user, throw if not logged in
 * Use this in Service layer when auth is required
 */
export async function requireUser(): Promise<AuthUser> {
  const { user } = await getCurrentUser();
  if (user == null) throw new UnauthorizedError();

  return user;
}

/**
 * Action result type for consistent server action returns
 */
export type ActionResult<T = void> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      message: string;
    };
