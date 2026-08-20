"use server";

import { checkResumeAnalysisPermissionService } from "./service";

/**
 * Action Layer for Resume Analysis
 * Handles: Delegates to service layer, lets errors bubble to callers
 */

/**
 * Check if user can analyze a resume
 * Used for UI permission checks; errors bubble to callers/error boundaries
 */
export async function canAnalyzeResumeAction(): Promise<boolean> {
  return await checkResumeAnalysisPermissionService();
}
