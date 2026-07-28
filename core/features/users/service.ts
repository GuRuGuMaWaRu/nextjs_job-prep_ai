import { cacheTag } from "next/cache";

import { DatabaseError } from "@/core/lib/errors";
import type { AuthUser } from "@/core/features/auth/types";
import { getUserByIdDb } from "@/core/features/users/db";
import { getUserIdTag } from "@/core/features/users/cache";

export async function getUserService(id: string): Promise<AuthUser | null> {
  "use cache";
  cacheTag(getUserIdTag(id));

  try {
    return await getUserByIdDb(id);
  } catch (error) {
    console.error("Database error getting user:", error);
    throw new DatabaseError("Failed to fetch user from database", error);
  }
}
