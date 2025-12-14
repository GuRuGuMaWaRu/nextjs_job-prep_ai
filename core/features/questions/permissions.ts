import { getCurrentUser } from "@/core/services/clerk/lib/getCurrentUser";
import { hasPermission } from "@/core/services/clerk/lib/hasPermission";
import { getQuestionCountDb } from "@/core/features/questions/db";

export async function checkQuestionsPermission() {
  return await Promise.any([
    hasPermission("unlimited_questions").then(
      (permitted) => permitted || Promise.reject()
    ),
    Promise.all([hasPermission("5_questions"), getQuestionCount()]).then(
      ([permitted, count]) => (permitted && count < 1) || Promise.reject()
    ),
  ]).catch(() => false);
}

async function getQuestionCount() {
  const { userId } = await getCurrentUser();
  if (userId == null) {
    return 0;
  }
  return getQuestionCountDb(userId);
}
