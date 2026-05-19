export const INTERVIEW_ACTION_MESSAGES = {
  createUnauthorized: "You must be logged in to create an interview.",
  createJobInfoNotFound:
    "Job posting not found or you don't have access to it.",
  createDatabaseError: "Failed to create interview. Please try again.",
  updateUnauthorized: "You must be logged in to update this interview.",
  updateDatabaseError: "Failed to update interview. Please try again.",
  feedbackUnauthorized: "You must be logged in to generate feedback.",
  feedbackDatabaseError: "Failed to save feedback. Please try again.",
  feedbackUnexpectedError: "Failed to generate feedback. Please try again.",
  unexpectedError: "An unexpected error occurred. Please try again.",
} as const;
