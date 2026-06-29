import { expect } from "@playwright/test";

import { authedTest } from "../fixtures/auth";
import {
  createTestJobInfo,
  mockAiQuestionGenerationRoute,
  mockAiFeedbackGenerationRoute,
} from "../helpers";

authedTest.describe("AI questions", () => {
  authedTest.use({ authEmailPrefix: "ai-question-generation-" });

  authedTest(
    "user can generate a question and enter an answer",
    async ({ authedPage, session }) => {
      const jobInfo = await createTestJobInfo(session.userId);
      await mockAiQuestionGenerationRoute(authedPage, {
        expectedPrompt: "easy",
        expectedJobInfoId: jobInfo.id,
      });

      await authedPage.goto(`/app/jobInfo/${jobInfo.id}/questions`);

      await expect(
        authedPage.getByText(
          "Get started by selecting a question difficulty above.",
        ),
      ).toBeVisible();

      await authedPage.getByRole("button", { name: "Easy" }).click();

      await expect(authedPage.getByText("What is a React hook?")).toBeVisible();
      await expect(authedPage.getByText(/Question ID:/)).toHaveCount(0);

      const answer = authedPage.getByPlaceholder("Type your answer here...");
      const sampleAnswer =
        "A hook lets React components use state and effects.";

      await expect(answer).toBeEnabled();
      await answer.fill(sampleAnswer);
      await expect(answer).toHaveValue(sampleAnswer);
    },
  );

  authedTest(
    "user can submit an answer and receive feedback",
    async ({ authedPage, session }) => {
      const jobInfo = await createTestJobInfo(session.userId);
      await mockAiQuestionGenerationRoute(authedPage, {
        expectedPrompt: "easy",
        expectedJobInfoId: jobInfo.id,
        questionId: "00000000-0000-4000-8000-000000009901",
        questionText: "What is a React hook?",
      });
      await mockAiFeedbackGenerationRoute(authedPage, {
        expectedPrompt: "A hook lets React components use state and effects.",
        expectedQuestionId: "00000000-0000-4000-8000-000000009901",
        feedbackText: "Good answer. You explained hooks clearly.",
      });

      await authedPage.goto(`/app/jobInfo/${jobInfo.id}/questions`);
      await authedPage.getByRole("button", { name: "Easy" }).click();

      await expect(authedPage.getByText("What is a React hook?")).toBeVisible();

      const answer = authedPage.getByPlaceholder("Type your answer here...");
      await expect(answer).toBeEnabled();
      await answer.fill("A hook lets React components use state and effects.");

      await authedPage.getByRole("button", { name: "Answer" }).click();

      await expect(
        authedPage.getByText("Good answer. You explained hooks clearly."),
      ).toBeVisible();
      await expect(
        authedPage.getByRole("button", { name: "Easy" }),
      ).toBeVisible();
      await expect(
        authedPage.getByRole("button", { name: "Medium" }),
      ).toBeVisible();
      await expect(
        authedPage.getByRole("button", { name: "Hard" }),
      ).toBeVisible();
    },
  );
});
