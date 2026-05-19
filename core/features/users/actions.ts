"use server";

import type { AuthUser } from "@/core/features/auth/types";
import { getUserService } from "@/core/features/users/service";

export async function getUserAction(id: string): Promise<AuthUser | null> {
  return await getUserService(id);
}
