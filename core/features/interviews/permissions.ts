import { getInterviewCountDb } from "@/core/features/interviews/db";
import { getCurrentUser } from "@/core/auth/server";

// TODO: Implement proper permission system in Phase 5
// For now, allow all authenticated users unlimited access
export async function checkInterviewPermission() {
  const { userId } = await getCurrentUser();
  return userId != null;
}

async function getInterviewCount() {
  const { userId } = await getCurrentUser();
  if (userId == null) {
    return 0;
  }
  return getInterviewCountDb(userId);
}
