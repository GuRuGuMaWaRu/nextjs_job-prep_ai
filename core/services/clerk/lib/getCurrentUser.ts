import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/core/drizzle/db";
import { UserTable } from "@/core/drizzle/schema";
import { getUserIdTag } from "@/core/features/users/dbCache";

export async function getCurrentUser({ allData = false } = {}) {
  const { userId, redirectToSignIn } = await auth();

  return {
    userId,
    redirectToSignIn,
    user: allData && userId != null ? await getUser(userId) : undefined,
  };
}

async function getUser(id: string) {
  "use cache";
  cacheTag(getUserIdTag(id));

  return db.query.UserTable.findFirst({
    where: eq(UserTable.id, id),
  });
}
