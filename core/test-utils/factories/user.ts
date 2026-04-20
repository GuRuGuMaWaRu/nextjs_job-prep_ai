import type { AuthUser } from "@/core/features/auth/types";

let userCounter = 0;

function nextUserIndex(): number {
  userCounter += 1;
  return userCounter;
}

function buildUser(index: number, overrides: Partial<AuthUser>): AuthUser {
  const now = new Date("2024-01-01T00:00:00.000Z");

  return {
    id: `user-${index}`,
    name: `Test User ${index}`,
    email: `user-${index}@test.local`,
    image: null,
    passwordHash: null,
    emailVerified: now,
    plan: "free",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Builds a fully-populated `AuthUser` fixture with sensible defaults.
 *
 * Overrides are shallow-merged. Every call yields a unique `id`, `email`, and
 * `name` to keep tests that create multiple users free of collisions.
 *
 * Never use real customer emails in fixtures; defaults use `@test.local`.
 */
export function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return buildUser(nextUserIndex(), overrides);
}

/**
 * Builds an `AuthUser` already upgraded to the pro plan with a Stripe linkage.
 *
 * The user id, email, and Stripe identifiers all share the same index, so
 * tests that correlate a user with its Stripe objects can rely on matching
 * suffixes (e.g. `user-3` ↔ `cus_test_3` ↔ `sub_test_3`).
 */
export function makeProUser(overrides: Partial<AuthUser> = {}): AuthUser {
  const index = nextUserIndex();

  return buildUser(index, {
    plan: "pro",
    stripeCustomerId: `cus_test_${index}`,
    stripeSubscriptionId: `sub_test_${index}`,
    ...overrides,
  });
}
