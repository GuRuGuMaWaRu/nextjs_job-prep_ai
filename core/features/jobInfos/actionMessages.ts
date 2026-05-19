export const JOB_INFO_ACTION_MESSAGES = {
  invalidInput: "Invalid job information. Please check all required fields.",
  createUnauthorized: "You must be logged in to create a job posting.",
  createDatabaseError: "Failed to save job posting. Please try again.",
  updateUnauthorized: "You must be logged in to update this job posting.",
  updateNotFound: "Job posting not found or you don't have access to it.",
  updateDatabaseError: "Failed to update job posting. Please try again.",
  unexpectedError: "An unexpected error occurred. Please try again.",
} as const;
