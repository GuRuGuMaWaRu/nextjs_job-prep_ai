import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { eq, and } from "drizzle-orm";
import z from "zod";

import {
  OAuthProvider,
  oAuthProviders,
  UserTable,
  UserOAuthAccountTable,
} from "@/core/drizzle/schema";
import { routes } from "@/core/data/routes";
import { getOAuthClient } from "@/core/features/auth/oauth/base";
import { generateUserId } from "@/core/features/auth/tokens";
import { createSession } from "@/core/features/auth/session";
import { setSessionCookie } from "@/core/features/auth/cookies";
import { db } from "@/core/drizzle/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: rawProvider } = await params;

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const provider = z.enum(oAuthProviders).parse(rawProvider);

  if (typeof code !== "string" || typeof state !== "string") {
    redirect(`${routes.signIn}?oauthError=oauth_failed`);
  }

  try {
    const oAuthUser = await getOAuthClient(provider).fetchUser(
      code,
      state,
      await cookies(),
    );
    const user = await connectUserToAccount(oAuthUser, provider);

    const session = await createSession(user.id);
    await setSessionCookie(session.token, session.expiresAt);
  } catch (error) {
    console.error("OAuth error:", error);
    redirect(`${routes.signIn}?oauthError=oauth_failed`);
  }

  redirect(routes.app);
}

function connectUserToAccount(
  oAuthUser: { id: string; email: string; name: string },
  provider: OAuthProvider,
) {
  return db.transaction(async (tx) => {
    const existingOAuthAccount = await tx.query.UserOAuthAccountTable.findFirst({
      where: and(eq(UserOAuthAccountTable.provider, provider), eq(UserOAuthAccountTable.providerAccountId, oAuthUser.id)),
      columns: { userId: true },
    });

    if (existingOAuthAccount != null) {
      return { id: existingOAuthAccount.userId};
    }

    let user = await tx.query.UserTable.findFirst({
      where: eq(UserTable.email, oAuthUser.email),
      columns: { id: true },
    });

    if (user == null) {
      const userId = generateUserId();
      const [newUser] = await tx
        .insert(UserTable)
        .values({
          id: userId,
          email: oAuthUser.email,
          name: oAuthUser.name,
          passwordHash: null,
          image: null,
          emailVerified: null,
        })
        .returning({ id: UserTable.id });

      user = newUser;
    }

    await tx
      .insert(UserOAuthAccountTable)
      .values({
        userId: user.id,
        provider,
        providerAccountId: oAuthUser.id,
      })
      .onConflictDoNothing();

    return user;
  });
}
