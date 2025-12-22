import { generateSecureToken } from "@/core/features/auth/tokens";
import {
  SESSION_DURATION_MS,
  SESSION_REFRESH_THRESHOLD_MS,
} from "@/core/features/auth/constants";
import { dalAssertSuccess, dalDbOperation } from "@/core/dal/helpers";
import {
  createSessionDb,
  deleteAllUserSessionsDb,
  deleteExpiredSessionsDb,
  deleteSessionDb,
  extendSessionDb,
  getUserSessionsDb,
  validateSessionDb,
} from "@/core/features/auth/db";

export type Session = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
};

/**
 * Create a new session for a user
 * @param userId - User ID to create session for
 * @returns Session object with token
 */
export async function createSession(userId: string): Promise<Session> {
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const [session] = await dalAssertSuccess(
    await dalDbOperation(
      async () => await createSessionDb({ userId, token, expiresAt })
    )
  );

  return session;
}

/**
 * Validate a session token and return session data
 * @param token - Session token from cookie
 * @returns Session object if valid, null otherwise
 */
export async function validateSession(token: string): Promise<Session | null> {
  const [session] = await dalAssertSuccess(
    await dalDbOperation(async () => await validateSessionDb(token))
  );

  if (!session) {
    return null;
  }

  return session;
}

/**
 * Extend session if it's close to expiring
 * @param token - Session token
 * @returns Updated session if extended, original session otherwise
 */
export async function extendSessionIfNeeded(
  token: string
): Promise<Session | null> {
  const session = await validateSession(token);

  if (!session) {
    return null;
  }

  // Check if session is within the refresh threshold
  const timeUntilExpiry = session.expiresAt.getTime() - Date.now();

  if (timeUntilExpiry < SESSION_REFRESH_THRESHOLD_MS) {
    const newExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    const [updatedSession] = await dalAssertSuccess(
      await dalDbOperation(
        async () => await extendSessionDb(session.id, newExpiresAt)
      )
    );

    return updatedSession;
  }

  return session;
}

/**
 * Delete a session (logout)
 * @param token - Session token to delete
 */
export async function deleteSession(token: string): Promise<void> {
  await dalAssertSuccess(
    await dalDbOperation(async () => await deleteSessionDb(token))
  );
}

/**
 * Delete all sessions for a user (logout from all devices)
 * @param userId - User ID to delete sessions for
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  await dalAssertSuccess(
    await dalDbOperation(async () => await deleteAllUserSessionsDb(userId))
  );
}

/**
 * Delete expired sessions (cleanup job)
 * Should be run periodically
 */
export async function deleteExpiredSessions(): Promise<void> {
  await dalAssertSuccess(
    await dalDbOperation(async () => await deleteExpiredSessionsDb())
  );
}

/**
 * Get all active sessions for a user
 * @param userId - User ID
 * @returns Array of active sessions
 */
export async function getUserSessions(userId: string): Promise<Session[]> {
  return await dalAssertSuccess(
    await dalDbOperation(async () => await getUserSessionsDb(userId))
  );
}
