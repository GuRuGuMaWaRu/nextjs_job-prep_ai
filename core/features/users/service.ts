import { cacheTag } from "next/cache";

import { DatabaseError } from "@/core/dal/helpers";
import type { AuthUser } from "@/core/features/auth/types";
import { getUserByIdDb } from "@/core/features/users/db";
import { getUserIdTag } from "@/core/features/users/dbCache";

export async function getUserService(id: string): Promise<AuthUser | null> {
  "use cache";
  cacheTag(getUserIdTag(id));

  try {
    return (await getUserByIdDb(id)) ?? null;
  } catch (error) {
    console.error("Database error getting user:", error);
    throw new DatabaseError("Failed to fetch user from database", error);
  }
}
