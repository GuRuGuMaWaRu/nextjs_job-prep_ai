import { FREE_PLAN_LIMITS } from "@/core/features/auth/permissions";

const { interviews, questions, resume_analyses } = FREE_PLAN_LIMITS;

export type PlanCardDefinition = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: readonly string[];
  popular: boolean;
};

export const FREE_PLAN_CARD = {
  name: "Free",
  price: "$0",
  period: "forever",
  description: "Try the core workflows before upgrading",
  features: [
    `${interviews} AI voice interview`,
    `${resume_analyses} resume analyses`,
    `${questions} practice questions`,
    "Job-specific prep from your own descriptions",
  ],
  popular: false,
} as const satisfies PlanCardDefinition;

export const PRO_PLAN_CARD = {
  name: "Pro",
  price: "$29",
  period: "per month",
  description: "Unlimited practice for active job seekers",
  features: [
    "Unlimited AI voice interviews",
    "Unlimited resume analyses",
    "Unlimited practice questions",
    "Structured AI feedback on interviews and answers",
    "Job-specific prep from your own descriptions",
  ],
  popular: true,
} as const satisfies PlanCardDefinition;

export const PUBLIC_PLANS = [FREE_PLAN_CARD, PRO_PLAN_CARD] as const;

export const PRODUCT_FEATURES = [
  {
    title: "AI Voice Interviews",
    description:
      "Practice with a voice-based AI interviewer, then review structured feedback on your answers and communication.",
  },
  {
    title: "Resume Analysis",
    description:
      "Upload a resume against a job description and get ATS, job-match, and keyword feedback you can act on.",
  },
  {
    title: "Technical Question Practice",
    description:
      "Generate role-specific practice questions and get AI feedback on your written answers.",
  },
] as const;

export function formatFreePlanLimitsSummary() {
  return `${interviews} interview, ${resume_analyses} resume analyses, and ${questions} questions`;
}
