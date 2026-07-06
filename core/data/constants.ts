//** Permission and Plans */

export const PERMISSIONS = {
  INTERVIEWS: "interviews",
  QUESTIONS: "questions",
  RESUME_ANALYSES: "resume_analyses",
} as const;

type ValueOf<T> = T[keyof T];

export type Permission = ValueOf<typeof PERMISSIONS>;
type PlanLimitsByPlan = {
  free: Record<ValueOf<typeof PERMISSIONS>, number>;
  pro: Record<ValueOf<typeof PERMISSIONS>, null>;
};

export const PLAN_LIMITS = {
  free: {
    interviews: 1,
    questions: 10,
    resume_analyses: 3,
  },
  pro: {
    interviews: null,
    questions: null,
    resume_analyses: null,
  },
} as PlanLimitsByPlan;

//** Error messages */

export const PLAN_LIMIT_MESSAGE = "PLAN_LIMIT";
export const RATE_LIMIT_MESSAGE = "RATE_LIMIT";
export const HUME_UNAVAILABLE_MESSAGE = "HUME_UNAVAILABLE_MESSAGE";
export const FILE_SIZE_TOO_LARGE_MESSAGE = "FILE_SIZE_TOO_LARGE_MESSAGE";
export const FILE_TYPE_NOT_SUPPORTED_MESSAGE =
  "FILE_TYPE_NOT_SUPPORTED_MESSAGE";
