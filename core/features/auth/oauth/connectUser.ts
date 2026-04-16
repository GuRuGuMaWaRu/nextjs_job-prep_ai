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

type DbTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

type UserRowEmailState = { id: string; emailVerified: Date | null };

/**
 * When OAuth reports verified email but the DB row is still unverified, persist verification.
 */
async function syncEmailVerifiedFromOAuthIfNeeded(
  tx: DbTransaction,
  userRow: UserRowEmailState,
  oAuthUser: ResolvedOAuthUser,
) {
  if (oAuthUser.emailVerified && userRow.emailVerified == null) {
    await tx
      .update(UserTable)
      .set({ emailVerified: new Date() })
      .where(eq(UserTable.id, userRow.id));
  }
}

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
      const inserted = await tx
        .insert(UserTable)
        .values({
          id: userId,
          email: oAuthUser.email,
          name: oAuthUser.name,
          passwordHash: null,
          image: null,
          emailVerified: oAuthUser.emailVerified ? new Date() : null,
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

        assertOAuthEmailLinkAllowed(oAuthUser, afterConflict, provider);

        user = { id: afterConflict.id };

        await syncEmailVerifiedFromOAuthIfNeeded(tx, afterConflict, oAuthUser);
      }
    } else {
      user = { id: existingByEmail.id };

      await syncEmailVerifiedFromOAuthIfNeeded(tx, existingByEmail, oAuthUser);
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
