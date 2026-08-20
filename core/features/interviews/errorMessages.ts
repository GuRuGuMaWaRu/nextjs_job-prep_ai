export const INTERVIEW_ERROR_MESSAGES = {
  createUnauthorized: "You must be logged in to create an interview.",
  createDatabaseError: "Failed to create interview. Please try again.",
  feedbackDatabaseError: "Failed to save feedback. Please try again.",
  feedbackGenerationFailed: "Failed to generate feedback",
  feedbackUnauthorized: "You must be logged in to generate feedback.",
  feedbackUnexpectedError: "Failed to generate feedback. Please try again.",
  jobInfoNotFoundOrNoAccess:
    "Job posting not found or you don't have access to it.",
  notCompleted: "Interview has not been completed yet",
  notFoundOrNoAccess: "Interview not found or you don't have access to it",
  unexpectedError: "An unexpected error occurred. Please try again.",
  updateDatabaseError: "Failed to update interview. Please try again.",
  updateForbidden: "You don't have permission to update this interview",
  updateInvalidInput: "Invalid interview update.",
  updateUnauthorized: "You must be logged in to update this interview.",
} as const;
