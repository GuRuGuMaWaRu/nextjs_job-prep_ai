"use server";

import { cache } from "react";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { hashPassword, verifyPassword } from "@/core/features/auth/password";
import {
  setSessionCookie,
  getSessionToken,
  deleteSessionCookie,
} from "@/core/features/auth/cookies";
import {
  createSession,
  deleteSession,
  extendSessionIfNeeded,
  validateSession,
} from "@/core/features/auth/session";
import { generateUserId } from "@/core/features/auth/tokens";
import { createUserDb, findUserByEmailDb } from "@/core/features/auth/db";
import { signInSchema, signUpSchema } from "@/core/features/auth/schemas";
import { getOAuthClient } from "@/core/features/auth/oauth/base";
import { getUser } from "@/core/features/users/actions";
import { routes } from "@/core/data/routes";
import type { CurrentUser } from "@/core/features/auth/types";
import type { OAuthProvider } from "@/core/drizzle/schema/userOAuthAccount";

type AuthFieldErrors = {
  name?: string;
  email?: string;
  password?: string;
};

type ActionState = {
  error?: string;
  success?: boolean;
  fieldErrors?: AuthFieldErrors;
  fields?: {
    name?: string;
    email?: string;
  };
};

function getFirstFieldErrors(error: z.ZodError): AuthFieldErrors {
  const { fieldErrors } = error.flatten();

  return {
    name: fieldErrors.name?.[0],
    email: fieldErrors.email?.[0],
    password: fieldErrors.password?.[0],
  };
}

/**
 * Sign up a new user
 */
export async function signUpAction(
  _prevState: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const rawName = formData.get("name");
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  const unsafeData = {
    name: typeof rawName === "string" ? rawName : "",
    email: typeof rawEmail === "string" ? rawEmail : "",
    password: typeof rawPassword === "string" ? rawPassword : "",
  };

  // Store fields to return on error
  const fields = { name: unsafeData.name, email: unsafeData.email };

  const validation = signUpSchema.safeParse(unsafeData);
  if (!validation.success) {
    return {
      error: "Please correct the highlighted fields.",
      fields,
      fieldErrors: getFirstFieldErrors(validation.error),
    };
  }

  try {
    // Check if user already exists
    const existingUser = await findUserByEmailDb(validation.data.email);

    if (existingUser) {
      return {
        error: "An account with this email already exists",
        fields,
        fieldErrors: { email: "An account with this email already exists" },
      };
    }

    // Hash password
    const passwordHash = await hashPassword(validation.data.password);

    // Create user
    const userId = generateUserId();
    await createUserDb({
      id: userId,
      name: validation.data.name,
      email: validation.data.email.toLowerCase(),
      passwordHash,
    });

    // Create session
    const session = await createSession(userId);

    // Set session cookie
    await setSessionCookie(session.token, session.expiresAt);
  } catch (error) {
    console.error("Signup error:", error);
    return { error: "An error occurred during signup", fields };
  }

  redirect(routes.app);
}

/**
 * Sign in an existing user
 */
export async function signInAction(
  _prevState: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  const unsafeData = {
    email: typeof rawEmail === "string" ? rawEmail : "",
    password: typeof rawPassword === "string" ? rawPassword : "",
  };

  // Store fields to return on error
  const fields = { email: unsafeData.email };

  const validation = signInSchema.safeParse(unsafeData);
  if (!validation.success) {
    return {
      error: "Please correct the highlighted fields.",
      fields,
      fieldErrors: getFirstFieldErrors(validation.error),
    };
  }

  try {
    // Find user by email
    const user = await findUserByEmailDb(validation.data.email);

    if (!user || !user.passwordHash) {
      return { error: "Invalid email or password", fields };
    }

    // Verify password
    const isValidPassword = await verifyPassword(
      validation.data.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      return { error: "Invalid email or password", fields };
    }

    // Create session
    const session = await createSession(user.id);

    // Set session cookie
    await setSessionCookie(session.token, session.expiresAt);
  } catch (error) {
    console.error("Signin error:", error);
    return { error: "An error occurred during sign in", fields };
  }

  redirect(routes.app);
}

/**
 * Sign out the current user
 */
export async function signOutAction(): Promise<void> {
  const token = await getSessionToken();

  if (token) {
    // Delete session from database
    await deleteSession(token);
  }

  // Delete session cookie
  await deleteSessionCookie();

  // Revalidate all routes to clear any cached user data
  revalidatePath("/", "layout");

  // Redirect to landing page
  redirect(routes.landing);
}

const getSessionCached = cache(async () => {
  const token = await getSessionToken();
  if (!token) return null;
  return extendSessionIfNeeded(token);
});

const getCurrentUserCached = cache(
  async (allData: boolean): Promise<CurrentUser> => {
    try {
      const session = await getSessionCached();

      if (!session) {
        return {
          userId: null,
          redirectToSignIn: () => redirect(routes.signIn),
        };
      }

      const userId = session.userId;

      return {
        userId,
        user: allData ? ((await getUser(userId)) ?? undefined) : undefined,
        redirectToSignIn: () => redirect(routes.signIn),
      };
    } catch (error) {
      console.error(
        "getCurrentUserCached: session or user load failed:",
        error,
      );

      return {
        userId: null,
        redirectToSignIn: () => redirect(routes.signIn),
      };
    }
  },
);

/**
 * Get the current authenticated user from session (session row only; no user table fetch).
 *
 * @returns Object with userId, optional user data, and redirectToSignIn helper
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  return getCurrentUserCached(false);
}

/**
 * Same as {@link getCurrentUser} but loads the full user row from the database.
 *
 * @returns Object with userId, user, and redirectToSignIn helper
 */
export async function getCurrentUserWithProfile(): Promise<CurrentUser> {
  return getCurrentUserCached(true);
}

export async function validateSessionAction(token: string): Promise<boolean> {
  try {
    const session = await validateSession(token);

    if (!session) {
      await deleteSessionCookie();

      return false;
    }

    return true;
  } catch (error) {
    console.error("Session validation error:", error);
    return false;
  }
}

export async function signInWithOAuthAction(provider: OAuthProvider) {
  const oAuthClient = getOAuthClient(provider);

  redirect(oAuthClient.createAuthUrl(await cookies()));
}
