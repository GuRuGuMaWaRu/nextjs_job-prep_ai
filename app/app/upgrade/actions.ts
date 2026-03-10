"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/core/features/auth/actions";
import { revalidateUserCache } from "@/core/features/users/dbCache";

/**
 * Revalidates the upgrade page and current user cache so plan (e.g. Pro) shows
 * after Stripe redirect. Must be called from a client effect or form, not during render.
 */
export async function revalidateUpgradePage() {
  revalidatePath("/app/upgrade");
  const { userId } = await getCurrentUser();
  if (userId) revalidateUserCache(userId);
}
