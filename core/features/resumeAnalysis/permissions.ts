import { getCurrentUser } from "@/core/auth/server";

// TODO: Implement proper permission system in Phase 5
// For now, allow all authenticated users unlimited access
export async function checkResumeAnalysisPermission() {
  const { userId } = await getCurrentUser();
  return userId != null;
}
