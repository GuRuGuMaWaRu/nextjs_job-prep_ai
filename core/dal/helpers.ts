import { getCurrentUser } from "@/core/features/auth/actions";

/**
 * Custom error classes for better error handling throughout the application
 */

export class UnauthorizedError extends Error {
  constructor(message = "You must be logged in to perform this action") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = "DatabaseError";
  }
}

/**
 * DAL Helper Functions
 */

/**
 * Require authenticated user, throw if not logged in
 * Use this in Service layer when auth is required
 */
export async function requireUser(): Promise<string> {
  const { userId } = await getCurrentUser();

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
  const { userId, user } = await getCurrentUser({ allData: true });

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
