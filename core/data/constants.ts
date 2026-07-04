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
