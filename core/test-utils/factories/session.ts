import type { Session } from "@/core/features/auth/session";

let sessionCounter = 0;

function nextSessionIndex(): number {
  sessionCounter += 1;
  return sessionCounter;
}

/**
 * Builds a `Session` fixture with defaults that pass `validateSession` /
 * `validateSessionDb` semantics (not expired vs real time) out of the box.
 *
 * `createdAt` is fixed for deterministic snapshots; `expiresAt` is anchored to
 * `Date.now()` so it stays in the future as wall-clock time advances.
 *
 * Overrides are shallow-merged; every call yields a unique id + token.
 */
export function makeSession(overrides: Partial<Session> = {}): Session {
  const index = nextSessionIndex();
  const createdAt = new Date("2024-01-01T00:00:00.000Z");
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

  return {
    id: `session-${index}`,
    userId: `user-${index}`,
    token: `token-${index}-${"a".repeat(20)}`,
    expiresAt: new Date(Date.now() + oneWeekMs),
    createdAt,
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
