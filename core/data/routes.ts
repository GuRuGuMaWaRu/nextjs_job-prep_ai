export const routes = {
  landing: "/",
  app: "/app",
  onboarding: "/onboarding",
  signIn: "/sign-in",
  signUp: "/sign-up",
  upgrade: "/app/upgrade",
  newJobInfo: "/app/jobInfo/new",
  jobInfo: (jobInfoId: string) => `/app/jobInfo/${jobInfoId}`,
  interviews: (jobInfoId: string) => `/app/jobInfo/${jobInfoId}/interviews`,
  interview: (jobInfoId: string, interviewId: string) =>
    `/app/jobInfo/${jobInfoId}/interviews/${interviewId}`,
  newInterview: (jobInfoId: string) =>
    `/app/jobInfo/${jobInfoId}/interviews/new`,
  questions: (jobInfoId: string) => `/app/jobInfo/${jobInfoId}/questions`,
  feedback: (interviewId: string) => `/app/interviews/${interviewId}/feedback`,
  api: {
    aiResumeAnalysis: "/api/ai/resumes/analyze",
    aiQuestionGeneration: "/api/ai/questions/generate-question",
    aiQuestionFeedback: "/api/ai/questions/generate-feedback",
  },
};
