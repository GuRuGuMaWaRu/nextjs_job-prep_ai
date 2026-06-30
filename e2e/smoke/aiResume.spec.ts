import { expect } from "@playwright/test";
import { resolve } from "node:path";

import { authedTest } from "../fixtures/auth";
import { createTestJobInfo, mockAiResumeAnalysisRoute } from "../helpers";

authedTest.describe("AI resume analysis", () => {
  authedTest.use({ authEmailPrefix: "ai-resume-analysis-" });

  authedTest(
    "user can upload a resume and see analysis results",
    async ({ authedPage, session }) => {
      const jobInfo = await createTestJobInfo(session.userId);

      await mockAiResumeAnalysisRoute(authedPage, {
        expectedJobInfoId: jobInfo.id,
        overallScore: 7,
        atsSummary: "The resume is readable and ATS-friendly.",
      });

      await authedPage.goto(`/app/jobInfo/${jobInfo.id}/resume`);

      await authedPage
        .getByLabel("Upload your resume")
        .setInputFiles(resolve("e2e/fixtures/sample-resume.txt"));

      await expect(authedPage.getByText("Overall Score: 7/10")).toBeVisible();

      await authedPage
        .getByRole("button", {
          name: /ATS Compatibility/,
        })
        .click();

      await expect(
        authedPage.getByText("The resume is readable and ATS-friendly."),
      ).toBeVisible();
    },
  );
});
