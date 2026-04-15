import { eq, and } from "drizzle-orm";

import {
  OAuthProvider,
  UserTable,
  UserOAuthAccountTable,
} from "@/core/drizzle/schema";
import { generateUserId } from "@/core/features/auth/tokens";
import { db } from "@/core/drizzle/db";

import type { ResolvedOAuthUser } from "./base";
import { assertOAuthEmailLinkAllowed } from "./oauthLinkPolicy";

/**
 * Links an OAuth identity to a user: reuse existing OAuth mapping, match by verified email, or create a user.
 */
export function connectUserToAccount(
  oAuthUser: ResolvedOAuthUser,
  provider: OAuthProvider,
) {
  return db.transaction(async (tx) => {
    const existingOAuthAccount = await tx.query.UserOAuthAccountTable.findFirst(
      {
        where: and(
          eq(UserOAuthAccountTable.provider, provider),
          eq(UserOAuthAccountTable.providerAccountId, oAuthUser.id),
        ),
        columns: { userId: true },
      },
    );

    if (existingOAuthAccount != null) {
      return { id: existingOAuthAccount.userId };
    }

    const existingByEmail =
      (await tx.query.UserTable.findFirst({
        where: eq(UserTable.email, oAuthUser.email),
        columns: { id: true, emailVerified: true },
      })) ?? null;

    assertOAuthEmailLinkAllowed(oAuthUser, existingByEmail, provider);

    let user: { id: string };

    if (existingByEmail == null) {
      const userId = generateUserId();
      const [newUser] = await tx
        .insert(UserTable)
        .values({
          id: userId,
          email: oAuthUser.email,
          name: oAuthUser.name,
          passwordHash: null,
          image: null,
          emailVerified: oAuthUser.emailVerified ? new Date() : null,
        })
        .returning({ id: UserTable.id });

      user = newUser;
    } else {
      user = { id: existingByEmail.id };

      if (oAuthUser.emailVerified && existingByEmail.emailVerified == null) {
        await tx
          .update(UserTable)
          .set({ emailVerified: new Date() })
          .where(eq(UserTable.id, existingByEmail.id));
      }
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
