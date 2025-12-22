import { eq, gt, and, lt } from "drizzle-orm";

import { db } from "@/core/drizzle/db";
import { SessionTable, UserTable } from "@/core/drizzle/schema";

export async function findUserByEmailDb(email: string) {
  return await db.query.UserTable.findFirst({
    where: eq(UserTable.email, email.toLowerCase()),
  });
}

export async function createUserDb(userData: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}) {
  return await db.insert(UserTable).values({
    ...userData,
    image: null,
    emailVerified: null,
  });
}

export async function createSessionDb(sessionData: {
  userId: string;
  token: string;
  expiresAt: Date;
}) {
  return await db.insert(SessionTable).values(sessionData).returning();
}

export async function validateSessionDb(token: string) {
  return await db
    .select()
    .from(SessionTable)
    .where(
      and(eq(SessionTable.token, token), gt(SessionTable.expiresAt, new Date()))
    )
    .limit(1);
}

export async function extendSessionDb(sessionId: string, expiresAt: Date) {
  return await db
    .update(SessionTable)
    .set({ expiresAt })
    .where(eq(SessionTable.id, sessionId))
    .returning();
}

export async function deleteSessionDb(token: string) {
  return await db.delete(SessionTable).where(eq(SessionTable.token, token));
}

export async function deleteAllUserSessionsDb(userId: string) {
  return await db.delete(SessionTable).where(eq(SessionTable.userId, userId));
}

export async function deleteExpiredSessionsDb() {
  return await db
    .delete(SessionTable)
    .where(lt(SessionTable.expiresAt, new Date()));
}

export async function getUserSessionsDb(userId: string) {
  return await db
    .select()
    .from(SessionTable)
    .where(
      and(
        eq(SessionTable.userId, userId),
        gt(SessionTable.expiresAt, new Date())
      )
    );
}
