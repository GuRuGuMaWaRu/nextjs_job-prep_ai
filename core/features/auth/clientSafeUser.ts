import type { AuthUser } from "@/core/features/auth/types";

/**
 * Fields that are safe to serialize from a Server Component into a Client
 * Component (navbar identity menu, etc.).
 */
export type ClientSafeUser = {
  name: string;
  email: string;
  image: string | null;
};

/**
 * Minimal identity fields for avatar / display-only client UI.
 */
export type ClientSafeUserIdentity = {
  name: string;
  image: string | null;
};

/**
 * Allowlists AuthUser fields that may cross the RSC → client boundary.
 *
 * Next.js serializes the entire prop object into the RSC payload. Passing a
 * full DB user row would expose passwordHash and Stripe identifiers in the
 * browser even when the client component only types a subset of fields.
 */
export function toClientSafeUser(
  user: Pick<AuthUser, "name" | "email" | "image">,
): ClientSafeUser {
  return {
    name: user.name,
    email: user.email,
    image: user.image,
  };
}

/**
 * Allowlists identity fields for avatar / display-only client UI.
 */
export function toClientSafeUserIdentity(
  user: Pick<AuthUser, "name" | "image">,
): ClientSafeUserIdentity {
  return {
    name: user.name,
    image: user.image,
  };
}
