"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
} from "@/core/features/auth/session";
import { generateUserId } from "@/core/features/auth/tokens";
import { createUserDb, findUserByEmailDb } from "@/core/features/auth/db";
import { getUser } from "@/core/features/users/actions";
import { signInSchema, signUpSchema } from "@/core/features/auth/schemas";
import { routes } from "@/core/data/routes";
import { ActionResult } from "@/core/dal/helpers";

export type SignUpFormData = z.infer<typeof signUpSchema>;

export async function signUpAction(
  values: SignUpFormData
): Promise<ActionResult<void>> {
  const parsed = signUpSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please check your input and try again.",
    };
  }

  const { name, email, password } = parsed.data;

  try {
    const existingUser = await findUserByEmailDb(email);
    if (existingUser) {
      return {
        success: false,
        message: "An account with this email already exists",
      };
    }

    const passwordHash = await hashPassword(password);

    const userId = generateUserId();
    await createUserDb({
      id: userId,
      name,
      email: email.toLowerCase(),
      passwordHash,
    });

    const session = await createSession(userId);

    await setSessionCookie(session.token, session.expiresAt);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Signup error:", error);
    return { success: false, message: "An error occurred during signup" };
  }
}

export type SignInFormData = z.infer<typeof signInSchema>;

export async function signInAction(
  values: SignInFormData
): Promise<ActionResult<void>> {
  const parsed = signInSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please check your input and try again.",
    };
  }

  const { email, password } = parsed.data;

  try {
    const user = await findUserByEmailDb(email);
    if (!user || !user.passwordHash) {
      return { success: false, message: "Invalid email or password" };
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return { success: false, message: "Invalid email or password" };
    }

    const session = await createSession(user.id);

    await setSessionCookie(session.token, session.expiresAt);
  } catch (error) {
    console.error("Signin error:", error);
    return { success: false, message: "An error occurred during sign in" };
  }

  return { success: true, data: undefined };
}

export async function signOutAction(): Promise<void> {
  const token = await getSessionToken();

  if (token) {
    await deleteSession(token);
  }

  await deleteSessionCookie();

  revalidatePath("/", "layout");

  redirect(routes.landing);
}

type AuthUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  passwordHash: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type CurrentUser = {
  userId: string | null;
  user?: AuthUser;
  redirectToSignIn: () => never;
};

/**
 * Get the current authenticated user from session
 *
 * @param options.allData - Whether to fetch full user data from database
 * @returns Object with userId, optional user data, and redirectToSignIn helper
 */
export async function getCurrentUser({
  allData = false,
}: { allData?: boolean } = {}): Promise<CurrentUser> {
  const token = await getSessionToken();

  if (!token) {
    return {
      userId: null,
      redirectToSignIn: () => redirect(routes.signIn),
    };
  }

  // Validate and potentially extend the session
  const session = await extendSessionIfNeeded(token);

  if (!session) {
    return {
      userId: null,
      redirectToSignIn: () => redirect(routes.signIn),
    };
  }

  const userId = session.userId;

  return {
    userId,
    user: allData ? (await getUser(userId)) ?? undefined : undefined,
    redirectToSignIn: () => redirect(routes.signIn),
  };
}
