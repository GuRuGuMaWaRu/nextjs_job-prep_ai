import { getCurrentUser } from "@/core/features/auth/server";
import { getQuestionCountDb } from "@/core/features/questions/db";

// TODO: Implement proper permission system in Phase 5
// For now, allow all authenticated users unlimited access
export async function checkQuestionsPermission() {
  const { userId } = await getCurrentUser();
  return userId != null;
}

async function getQuestionCount() {
  const { userId } = await getCurrentUser();
  if (userId == null) {
    return 0;
  }
  return getQuestionCountDb(userId);
}
