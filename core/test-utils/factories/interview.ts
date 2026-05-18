import type { InterviewTable } from "@/core/drizzle/schema";
import { makeJobInfo } from "@/core/test-utils/factories/jobInfo";
import { TEST_FIXTURE_NOW_ISO } from "@/core/test-utils/fixture-dates";

let interviewCounter = 0;

function nextInterviewIndex(): number {
  interviewCounter += 1;
  return interviewCounter;
}

export type InterviewWithJobInfo = typeof InterviewTable.$inferSelect & {
  jobInfo: ReturnType<typeof makeJobInfo>;
};

export function makeInterview(
  overrides: Partial<InterviewWithJobInfo> = {},
): InterviewWithJobInfo {
  const index = nextInterviewIndex();
  const now = new Date(TEST_FIXTURE_NOW_ISO);
  const jobInfo = overrides.jobInfo ?? makeJobInfo({ userId: `user-${index}` });

  return {
    id: `00000000-0000-4001-8000-${String(index).padStart(12, "0")}`,
    jobInfoId: jobInfo.id,
    duration: "00:00:00",
    humeChatId: null,
    feedback: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
    jobInfo,
  };
}
