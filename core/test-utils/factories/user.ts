import type { AuthUser } from "@/core/features/auth/types";

let userCounter = 0;

function nextUserIndex(): number {
  userCounter += 1;
  return userCounter;
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
  const index = nextUserIndex();
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
 * Builds an `AuthUser` already upgraded to the pro plan with a Stripe linkage.
 */
export function makeProUser(overrides: Partial<AuthUser> = {}): AuthUser {
  const index = nextUserIndex();

  return makeUser({
    plan: "pro",
    stripeCustomerId: `cus_test_${index}`,
    stripeSubscriptionId: `sub_test_${index}`,
    ...overrides,
  });
}
