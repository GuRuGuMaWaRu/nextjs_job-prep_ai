import { generateSecureToken, hashToken } from "@/core/features/auth/tokens";
import {
  SESSION_DURATION_MS,
  SESSION_REFRESH_THRESHOLD_MS,
} from "@/core/features/auth/constants";
import { DatabaseError } from "@/core/dal/errors";
import {
  createSessionDb,
  deleteAllUserSessionsDb,
  deleteExpiredSessionsDb,
  deleteSessionDb,
  extendSessionDb,
  getSessionByTokenDb,
} from "@/core/features/auth/db";

export type Session = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
};

export type NewSession = Pick<Session, "token" | "expiresAt">;

export type ActiveSession = Pick<Session, "id" | "userId" | "expiresAt">;

/**
 * Create a new session for a user
 * @param userId - User ID to create session for
 * @returns Session object with token (unhashed for use in cookies)
 */
export async function createSession(userId: string): Promise<NewSession> {
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const hashedToken = hashToken(token);

  try {
    const [session] = await createSessionDb({
      userId,
      token: hashedToken,
      expiresAt,
    });
    return { ...session, token };
  } catch (error) {
    console.error("Database error creating session:", error);
    throw new DatabaseError("Failed to create session", error);
  }
}

/**
 * Validate a session token and return session data
 * @param token - Session token from cookie
 * @returns Session object if valid, null otherwise
 */
export async function getSessionByToken(
  token: string,
): Promise<ActiveSession | null> {
  try {
    const hashedToken = hashToken(token);
    const session = await getSessionByTokenDb(hashedToken);

    if (!session) {
      return null;
    }

    return session;
  } catch (error) {
    console.error("Database error validating session:", error);
    throw new DatabaseError("Failed to validate session", error);
  }
}

/**
 * Extend session if it's close to expiring
 * @param token - Session token
 * @returns Updated session if extended, original session otherwise
 */
export async function extendSessionIfNeeded(
  token: string,
): Promise<ActiveSession | null> {
  const session = await getSessionByToken(token);

  if (!session) {
    return null;
  }

  // Check if session is within the refresh threshold
  const timeUntilExpiry = session.expiresAt.getTime() - Date.now();

  if (timeUntilExpiry < SESSION_REFRESH_THRESHOLD_MS) {
    try {
      const newExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);
      const [updatedSession] = await extendSessionDb(session.id, newExpiresAt);
      return updatedSession;
    } catch (error) {
      console.error("Database error extending session:", error);
      throw new DatabaseError("Failed to extend session", error);
    }
  }

  return session;
}

/**
 * Delete a session (logout)
 * @param token - Session token to delete
 */
export async function deleteSession(token: string): Promise<void> {
  try {
    const hashedToken = hashToken(token);
    await deleteSessionDb(hashedToken);
  } catch (error) {
    console.error("Database error deleting session:", error);
    throw new DatabaseError("Failed to delete session", error);
  }
}

/**
 * Delete all sessions for a user (logout from all devices)
 * @param userId - User ID to delete sessions for
 */
//** TODO: currently not used anywhere */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  try {
    await deleteAllUserSessionsDb(userId);
  } catch (error) {
    console.error("Database error deleting user sessions:", error);
    throw new DatabaseError("Failed to delete user sessions", error);
  }
}

/**
 * Delete expired sessions (cleanup job)
 * Should be run periodically
 */
//** TODO: currently not used anywhere */
export async function deleteExpiredSessions(): Promise<void> {
  try {
    await deleteExpiredSessionsDb();
  } catch (error) {
    console.error("Database error deleting expired sessions:", error);
    throw new DatabaseError("Failed to delete expired sessions", error);
  }
}
