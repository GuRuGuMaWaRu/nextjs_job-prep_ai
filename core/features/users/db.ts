import { eq } from "drizzle-orm";

import { UserTable } from "@/core/drizzle/schema";
import { db } from "@/core/drizzle/db";

export async function upsertUser(user: typeof UserTable.$inferInsert) {
  await db
    .insert(UserTable)
    .values(user)
    .onConflictDoUpdate({
      target: [UserTable.id],
      set: user,
    });
}

export async function deleteUser(id: string) {
  await db.delete(UserTable).where(eq(UserTable.id, id));
}
