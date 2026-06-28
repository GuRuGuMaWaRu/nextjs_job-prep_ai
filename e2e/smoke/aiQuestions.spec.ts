import { expect } from "@playwright/test";

import { authedTest } from "../fixtures/auth";
import { createTestJobInfo, mockAiQuestionGenerationRoute } from "../helpers";

authedTest.describe("AI questions", () => {
  authedTest.use({ authEmailPrefix: "ai-question-generation-" });

  authedTest(
    "user can generate a question and enter an answer",
    async ({ authedPage, session }) => {
      const jobInfo = await createTestJobInfo(session.userId);
      await mockAiQuestionGenerationRoute(authedPage);

      await authedPage.goto(`/app/jobInfo/${jobInfo.id}/questions`);

      await expect(
        authedPage.getByText(
          "Get started by selecting a question difficulty above.",
        ),
      ).toBeVisible();

      await authedPage.getByRole("button", { name: "Easy" }).click();

      await expect(authedPage.getByText("What is a React hook?")).toBeVisible();

      const answer = authedPage.getByPlaceholder("Type your answer here...");
      const sampleAnswer =
        "A hook lets React components use state and effects.";

      await expect(answer).toBeEnabled();
      await answer.fill(sampleAnswer);
      await expect(answer).toHaveValue(sampleAnswer);
    },
  );
});
