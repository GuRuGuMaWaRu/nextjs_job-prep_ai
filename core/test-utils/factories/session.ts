import type { Session } from "@/core/features/auth/session";

let sessionCounter = 0;

function nextSessionIndex(): number {
  sessionCounter += 1;
  return sessionCounter;
}

/**
 * Builds a `Session` fixture with defaults that pass `validateSession`
 * semantics (not expired) out of the box.
 *
 * Overrides are shallow-merged; every call yields a unique id + token.
 */
export function makeSession(overrides: Partial<Session> = {}): Session {
  const index = nextSessionIndex();
  const now = new Date("2024-01-01T00:00:00.000Z");
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

  return {
    id: `session-${index}`,
    userId: `user-${index}`,
    token: `token-${index}-${"a".repeat(20)}`,
    expiresAt: new Date(now.getTime() + oneWeekMs),
    createdAt: now,
    ...overrides,
  };
}

/**
 * Builds a session whose `expiresAt` is already in the past.
 */
export function makeExpiredSession(overrides: Partial<Session> = {}): Session {
  return makeSession({
    expiresAt: new Date("2020-01-01T00:00:00.000Z"),
    ...overrides,
  });
}
