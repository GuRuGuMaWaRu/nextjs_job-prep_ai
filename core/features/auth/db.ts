import { eq } from "drizzle-orm";
import { db } from "@/core/drizzle/db";

import { UserTable } from "@/core/drizzle/schema";

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
