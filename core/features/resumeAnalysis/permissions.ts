import { hasPermission } from "@/core/services/clerk/lib/hasPermission";

export async function checkResumeAnalysisPermission() {
  return hasPermission("unlimited_resume_analyses");
}
