"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/core/lib/getCurrentUser";
import { revalidateUserCache } from "@/core/features/users/cache";
import { routes } from "@/core/data/routes";

/**
 * Revalidates the upgrade page and current user cache so plan (e.g. Pro) shows
 * after Stripe redirect. Must be called from a client effect or form, not during render.
 */
export async function revalidateUpgradePage() {
  revalidatePath(routes.upgrade);
  const user = await getCurrentUser();

  if (user == null) {
    return;
  }

  revalidateUserCache(user.id);
}
