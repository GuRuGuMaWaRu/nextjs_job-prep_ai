"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  hashPassword,
  verifyPassword,
  validatePassword,
} from "@/core/features/auth/password";
import {
  setSessionCookie,
  getSessionToken,
  deleteSessionCookie,
} from "@/core/features/auth/cookies";
import { createSession, deleteSession } from "@/core/features/auth/session";
import { generateUserId } from "@/core/features/auth/tokens";
import { createUserDb, findUserByEmailDb } from "@/core/features/auth/db";
import { routes } from "@/core/data/routes";
import { dalAssertSuccess, dalDbOperation } from "@/core/dal/helpers";

type ActionState = {
  error?: string;
  success?: boolean;
  fields?: {
    name?: string;
    email?: string;
  };
};

/**
 * Sign up a new user
 */
export async function signUpAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Store fields to return on error
  const fields = { name, email };

  // Validate required fields
  if (!name || !email || !password) {
    return { error: "All fields are required", fields };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Invalid email address", fields };
  }

  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return { error: passwordValidation.error, fields };
  }

  try {
    // Check if user already exists
    const existingUser = await findUserByEmailDb(email);

    if (existingUser) {
      return { error: "An account with this email already exists", fields };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userId = generateUserId();
    dalAssertSuccess(
      await dalDbOperation(
        async () =>
          await createUserDb({
            id: userId,
            name,
            email: email.toLowerCase(),
            passwordHash,
          })
      )
    );

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
  formData: FormData
): Promise<ActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Store fields to return on error
  const fields = { email };

  // Validate required fields
  if (!email || !password) {
    return { error: "Email and password are required", fields };
  }

  try {
    // Find user by email
    const user = dalAssertSuccess(
      await dalDbOperation(async () => await findUserByEmailDb(email))
    );

    if (!user || !user.passwordHash) {
      return { error: "Invalid email or password", fields };
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);

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
