import { routes } from "@/core/data/routes";

describe("routes", () => {
  it("exposes stable top-level page routes", () => {
    expect(routes).toEqual(
      expect.objectContaining({
        landing: "/",
        app: "/app",
        signIn: "/sign-in",
        signUp: "/sign-up",
        upgrade: "/app/upgrade",
        newJobInfo: "/app/jobInfo/new",
      }),
    );
  });

  it("builds job info nested routes from ids without mutating the values", () => {
    const jobInfoId = "job-123";
    const interviewId = "interview-456";

    expect(routes.jobInfo(jobInfoId)).toBe("/app/jobInfo/job-123");
    expect(routes.interviews(jobInfoId)).toBe(
      "/app/jobInfo/job-123/interviews",
    );
    expect(routes.newInterview(jobInfoId)).toBe(
      "/app/jobInfo/job-123/interviews/new",
    );
    expect(routes.interview(jobInfoId, interviewId)).toBe(
      "/app/jobInfo/job-123/interviews/interview-456",
    );
    expect(routes.questions(jobInfoId)).toBe("/app/jobInfo/job-123/questions");
  });

  it("builds interview feedback routes", () => {
    expect(routes.feedback("interview-456")).toBe(
      "/app/interviews/interview-456/feedback",
    );
  });

  it("exposes stable API routes", () => {
    expect(routes.api).toEqual({
      aiResumeAnalysis: "/api/ai/resumes/analyze",
      aiQuestionGeneration: "/api/ai/questions/generate-question",
      aiQuestionFeedback: "/api/ai/questions/generate-feedback",
      validateSession: "/api/auth/validate-session",
    });
  });
});
