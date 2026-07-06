import { expect } from "@playwright/test";

import { authedTest } from "../fixtures/auth";
import {
  createTestInterview,
  createTestQuestion,
  createTestJobInfo,
  createTestResumeAnalysis,
} from "../helpers";

authedTest.describe("Plan limits", () => {
  authedTest.use({ authEmailPrefix: "interview-plan-limit-" });

  authedTest(
    "free user at interview limit sees PlanLimitAlert",
    async ({ authedPage, session }) => {
      const jobInfo = await createTestJobInfo(session.userId);
      await createTestInterview(jobInfo.id);

      const interviewsUrl = `/app/jobInfo/${jobInfo.id}/interviews`;

      await authedPage.goto(interviewsUrl);

      await expect(
        authedPage.getByRole("heading", { name: "Interviews" }),
      ).toBeVisible();
      await expect(authedPage.getByText("Plan Limit Reached")).toBeVisible();

      const upgradeLink = authedPage.getByRole("link", {
        name: "Upgrade",
        exact: true,
      });

      await expect(upgradeLink).toBeVisible();
      await expect(upgradeLink).toHaveAttribute("href", "/app/upgrade");
      await expect(authedPage).toHaveURL(interviewsUrl);
    },
  );

  authedTest.use({ authEmailPrefix: "questions-plan-limit-" });
  authedTest(
    "free user at questions limit sees PlanLimitAlert and cannot generate",
    async ({ authedPage, session }) => {
      const jobInfo = await createTestJobInfo(session.userId);

      const insertPromises = Array.from({ length: 10 }, (_, idx) =>
        createTestQuestion(jobInfo.id, {
          text: `E2E test question ${idx + 1}`,
        }),
      );

      await Promise.all(insertPromises);

      const questionsUrl = `/app/jobInfo/${jobInfo.id}/questions`;

      await authedPage.goto(questionsUrl);

      await expect(
        authedPage.getByText(
          "You have reached your plan limit for generated questions.",
        ),
      ).toBeVisible();
      await expect(authedPage.getByText("Plan Limit Reached")).toBeVisible();

      const upgradeLink = authedPage.getByRole("link", {
        name: "Upgrade",
        exact: true,
      });

      await expect(upgradeLink).toBeVisible();
      await expect(upgradeLink).toHaveAttribute("href", "/app/upgrade");
      await expect(authedPage).toHaveURL(questionsUrl);
      await expect(
        authedPage.getByRole("button", { name: "Easy", exact: true }),
      ).toBeDisabled();
    },
  );

  authedTest.use({ authEmailPrefix: "resume-plan-limit-" });
  authedTest(
    "free user at resume analysis limit is redirected to upgrade",
    async ({ authedPage, session }) => {
      const jobInfo = await createTestJobInfo(session.userId);

      const insertPromises = Array.from({ length: 3 }, () =>
        createTestResumeAnalysis(jobInfo.id),
      );

      await Promise.all(insertPromises);

      await Promise.all([
        authedPage.goto(`/app/jobInfo/${jobInfo.id}/resume`),
        authedPage.waitForURL("/app/upgrade"),
      ]);

      await expect(
        authedPage.getByRole("heading", { name: "Upgrade your plan" }),
      ).toBeVisible();
    },
  );
});
