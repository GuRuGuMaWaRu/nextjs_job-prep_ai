import { eq } from "drizzle-orm";

import { UserTable } from "@/core/drizzle/schema";
import { db } from "@/core/drizzle/db";
import { revalidateUserCache } from "@/core/features/users/dbCache";

export async function upsertUserDb(user: typeof UserTable.$inferInsert) {
  await db
    .insert(UserTable)
    .values(user)
    .onConflictDoUpdate({
      target: [UserTable.id],
      set: user,
    });

  revalidateUserCache(user.id);
}

export async function deleteUserDb(id: string) {
  await db.delete(UserTable).where(eq(UserTable.id, id));
  revalidateUserCache(id);
}

export async function getUserByIdDb(id: string) {
  const user = await db.query.UserTable.findFirst({
    where: eq(UserTable.id, id),
  });

  return user;
}
