import { getInterviewCountDb } from "@/core/features/interviews/db";
import { getCurrentUser } from "@/core/services/clerk/lib/getCurrentUser";
import { hasPermission } from "@/core/services/clerk/lib/hasPermission";

export async function checkInterviewPermission() {
  return await Promise.any([
    hasPermission("unlimited_interviews").then(
      (permitted) => permitted || Promise.reject()
    ),
    Promise.all([hasPermission("1_interview"), getInterviewCount()]).then(
      ([permitted, count]) => (permitted && count < 1) || Promise.reject()
    ),
  ]).catch(() => false);
}

async function getInterviewCount() {
  const { userId } = await getCurrentUser();
  if (userId == null) {
    return 0;
  }
  return getInterviewCountDb(userId);
}
