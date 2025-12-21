"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/core/drizzle/db";
import { UserTable } from "@/core/drizzle/schema";
import {
  hashPassword,
  verifyPassword,
  validatePassword,
  generateUserId,
  createSession,
  setSessionCookie,
  getSessionToken,
  deleteSession,
  deleteSessionCookie,
} from "@/core/auth";
import { routes } from "@/core/data/routes";

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
  prevState: ActionState | null,
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
    const existingUser = await db.query.UserTable.findFirst({
      where: eq(UserTable.email, email.toLowerCase()),
    });

    if (existingUser) {
      return { error: "An account with this email already exists", fields };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userId = generateUserId();
    await db.insert(UserTable).values({
      id: userId,
      name,
      email: email.toLowerCase(),
      passwordHash,
      image: null,
      emailVerified: null,
    });

    // Create session
    const session = await createSession(userId);

    // Set session cookie
    await setSessionCookie(session.token, session.expiresAt);
  } catch (error) {
    console.error("Signup error:", error);
    return { error: "An error occurred during signup", fields };
  }

  // Revalidate and redirect to app
  revalidatePath("/", "layout");
  redirect(routes.app);
}

/**
 * Sign in an existing user
 */
export async function signInAction(
  prevState: ActionState | null,
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
    const user = await db.query.UserTable.findFirst({
      where: eq(UserTable.email, email.toLowerCase()),
    });

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

  // Revalidate and redirect to app
  revalidatePath("/", "layout");
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
