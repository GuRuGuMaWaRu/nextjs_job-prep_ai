import { expect, test } from "@playwright/test";

import { FREE_PLAN_LIMITS } from "@/core/features/auth/permissions";
import {
  getResumeAnalysisCountDb,
  tryInsertResumeAnalysisDb,
} from "@/core/features/resumeAnalysis/db";

import {
  createAuthenticatedUser,
  createTestJobInfo,
  createTestResumeAnalysis,
} from "../helpers";

test.describe("tryInsertResumeAnalysisDb", () => {
  test("serializes concurrent reservations at the quota boundary", async () => {
    const session = await createAuthenticatedUser("resume-reservation-race-");
    const jobInfo = await createTestJobInfo(session.userId);
    const limit = FREE_PLAN_LIMITS.resume_analyses;

    await Promise.all(
      Array.from({ length: limit - 1 }, () =>
        createTestResumeAnalysis(jobInfo.id),
      ),
    );

    const [firstResult, secondResult] = await Promise.all([
      tryInsertResumeAnalysisDb({
        userId: session.userId,
        jobInfoId: jobInfo.id,
        limit,
      }),
      tryInsertResumeAnalysisDb({
        userId: session.userId,
        jobInfoId: jobInfo.id,
        limit,
      }),
    ]);

    const results = [firstResult, secondResult];
    const reservedIds = results.flatMap((result) => (result ? [result.id] : []));

    expect(reservedIds).toHaveLength(1);
    expect(results.filter((result) => result == null)).toHaveLength(1);
    expect(await getResumeAnalysisCountDb(session.userId)).toBe(limit);
  });
});
