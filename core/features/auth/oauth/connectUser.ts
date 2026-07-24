import { eq, and } from "drizzle-orm";

import { UserOAuthAccountTable, UserTable } from "@/core/drizzle/schema";
import type { OAuthProvider } from "@/core/drizzle/schema/oauthProviderIds";
import { generateUserId } from "@/core/features/auth/tokens";
import { db } from "@/core/drizzle/db";

import type { ResolvedOAuthUser } from "./base";
import {
  assertLocalAccountVerifiedForEmailLink,
  assertOAuthEmailLinkAllowed,
} from "./oauthLinkPolicy";

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

    assertOAuthEmailLinkAllowed(oAuthUser, provider);

    let user: { id: string };

    if (existingByEmail == null) {
      const userId = generateUserId();
      const inserted = await tx
        .insert(UserTable)
        .values({
          id: userId,
          email: oAuthUser.email,
          name: oAuthUser.name,
          passwordHash: null,
          image: null,
          emailVerified: new Date(),
        })
        .onConflictDoNothing({ target: UserTable.email })
        .returning({ id: UserTable.id });

      const newUser = inserted[0];

      if (newUser != null) {
        user = newUser;
      } else {
        const afterConflict =
          (await tx.query.UserTable.findFirst({
            where: eq(UserTable.email, oAuthUser.email),
            columns: { id: true, emailVerified: true },
          })) ?? null;

        if (afterConflict == null) {
          throw new Error("Expected user row after insert conflict on email");
        }

        assertOAuthEmailLinkAllowed(oAuthUser, provider);
        assertLocalAccountVerifiedForEmailLink(afterConflict, provider);

        user = { id: afterConflict.id };
      }
    } else {
      assertLocalAccountVerifiedForEmailLink(existingByEmail, provider);

      user = { id: existingByEmail.id };
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
