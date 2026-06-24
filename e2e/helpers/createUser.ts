import { randomUUID } from "crypto";

import { generateUserId } from "@/core/features/auth/tokens";
import { createUserDb } from "@/core/features/auth/db";
import { hashPassword } from "@/core/features/auth/password";
import { createSession } from "@/core/features/auth/session";
import {
  SESSION_COOKIE_NAME,
  COOKIE_OPTIONS,
} from "@/core/features/auth/constants";
import type { Page } from "@playwright/test";

import { E2E_BASE_URL } from "../constants";

type UserSession = {
  email: string;
  password: string;
  userId: string;
  sessionToken: string;
  sessionExpiresAt: Date;
};

export async function createAuthenticatedUser(
  emailIdentifier = "",
): Promise<UserSession> {
  const email = `e2e-${emailIdentifier}${randomUUID()}${Math.random()}@test.local`;
  const password = "password1";
  const name = "Test User";
  const userId = generateUserId();

  const passwordHash = await hashPassword(password);

  await createUserDb({
    id: userId,
    name,
    email,
    passwordHash,
  });

  const session = await createSession(userId);

  return {
    email,
    password,
    userId,
    sessionToken: session.token,
    sessionExpiresAt: session.expiresAt,
  };
}

export async function applySessionCookie(page: Page, session: UserSession) {
  await page.context().addCookies([
    {
      name: SESSION_COOKIE_NAME,
      value: session.sessionToken,
      url: E2E_BASE_URL,
      httpOnly: COOKIE_OPTIONS.httpOnly,
      secure: COOKIE_OPTIONS.secure,
      sameSite: "Lax",
      expires: Math.floor(session.sessionExpiresAt.getTime() / 1000),
    },
  ]);
}
