import {
  getCurrentUserAction,
  getCurrentUserWithProfileAction,
} from "@/core/features/auth/actions";
import { UnauthorizedError } from "@/core/dal/errors";

/**
 * DAL Helper Functions
 */

/**
 * Require authenticated user, throw if not logged in
 * Use this in Service layer when auth is required
 */
export async function requireUser(): Promise<string> {
  const { userId } = await getCurrentUserAction();

  if (!userId) {
    throw new UnauthorizedError();
  }

  return userId;
}

/**
 * Require user with full data
 * Throws UnauthorizedError if not authenticated
 */
export async function requireUserWithData() {
  const { userId, user } = await getCurrentUserWithProfileAction();

  if (!userId || !user) {
    throw new UnauthorizedError();
  }

  return { userId, user };
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
