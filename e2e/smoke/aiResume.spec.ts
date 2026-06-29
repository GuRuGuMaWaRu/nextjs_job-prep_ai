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
      });

      await authedPage.goto(`/app/jobInfo/${jobInfo.id}/resume`);

      await expect(
        authedPage.locator('[data-slot="card-title"]', {
          hasText: "Upload your resume",
        }),
      ).toBeVisible();
      await expect(
        authedPage.getByText("Drag your resume here or click to upload"),
      ).toBeVisible();

      await authedPage
        .locator("#resume-upload")
        .setInputFiles(resolve("e2e/fixtures/sample-resume.txt"));

      await expect(
        authedPage.locator('[data-slot="card-title"]', {
          hasText: "Analyzing your resume...",
        }),
      ).toBeVisible();
      await expect(
        authedPage.locator('[data-slot="card-title"]', {
          hasText: "Analysis Results",
        }),
      ).toBeVisible();
      await expect(authedPage.getByText("Overall Score: 8/10")).toBeVisible();

      const atsSection = authedPage.getByRole("button", {
        name: /ATS Compatibility/,
      });
      await expect(atsSection).toBeVisible();
      await atsSection.click();

      await expect(
        authedPage.getByText("Resume is ATS-friendly."),
      ).toBeVisible();
    },
  );
});
