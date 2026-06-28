import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

import { authedTest } from "../fixtures/auth";
import {
  expectAppHome,
  createTestJobInfo,
  createTestJobInfoUI,
  openJobInfoFromApp,
} from "../helpers";

/** Matches job info URLs against Playwright's full page URL (includes origin). */
function jobInfoUrlPattern(suffix = "") {
  return new RegExp(`/app/jobInfo/[0-9a-f-]{36}${suffix}$`);
}

type JobInfoSectionCase = {
  sectionName: string;
  sectionLink: string;
  sectionHeading: string;
  assert: "heading" | "text" | "label";
  checkElement: string;
};

const jobInfoSections = [
  {
    sectionName: "interviews",
    sectionLink: "Practice Interviewing",
    sectionHeading: "Interviews",
    assert: "heading",
    checkElement: "Interviews",
  },
  {
    sectionName: "questions",
    sectionLink: "Answer Technical Questions",
    sectionHeading: "Questions",
    assert: "text",
    checkElement: "Get started by selecting a question difficulty above.",
  },
  {
    sectionName: "resume",
    sectionLink: "Analyze Your Resume",
    sectionHeading: "Resume",
    assert: "label",
    checkElement: "Upload your resume",
  },
] satisfies JobInfoSectionCase[];

async function expectSectionContent(
  page: Page,
  { assert, checkElement }: Pick<JobInfoSectionCase, "assert" | "checkElement">,
) {
  switch (assert) {
    case "heading":
      await expect(
        page.getByRole("heading", { name: checkElement }),
      ).toBeVisible();
      break;
    case "text":
      await expect(page.getByText(checkElement)).toBeVisible();
      break;
    case "label":
      await expect(page.getByLabel(checkElement)).toBeVisible();
      break;
  }
}

authedTest.describe("Signed-in user flows", () => {
  authedTest.use({ authEmailPrefix: "see-upgrade-link-" });
  authedTest(
    "user can see Upgrade plan link in navbar",
    async ({ authedPage }) => {
      await authedPage.goto("/app");

      await expectAppHome(authedPage);
      await expect(authedPage.getByText("Current plan")).toBeVisible();
      await expect(
        authedPage.getByRole("link", { name: "Upgrade plan" }),
      ).toBeVisible();
    },
  );

  authedTest.use({ authEmailPrefix: "create-job-info-" });
  authedTest(
    "signed-in user can create a job info and see it on the main page",
    async ({ authedPage }) => {
      // Create job info
      const jobInfoInput = {
        name: "Frontend prep",
        description: "React and Next.js interview preparation.",
      };
      await createTestJobInfoUI(authedPage, jobInfoInput);

      // Ensure job info exists
      await expect(
        authedPage.getByRole("heading", { name: jobInfoInput.name }),
      ).toBeVisible();
      await expect(
        authedPage.getByText(jobInfoInput.description),
      ).toBeVisible();
    },
  );

  authedTest.use({ authEmailPrefix: "job-info-validation-" });
  authedTest(
    "empty job info form shows validation and does not navigate",
    async ({ authedPage }) => {
      await authedPage.goto("/app");

      const saveButton = authedPage.getByRole("button", {
        name: /save job information/i,
      });

      await expect(saveButton).toBeVisible();
      await saveButton.click();

      await expect(authedPage).toHaveURL(/\/app$/);

      const requiredMessages = authedPage.getByText("Required", {
        exact: true,
      });

      await expect(requiredMessages).toHaveCount(2);
      await expect(requiredMessages.first()).toBeVisible();
      await expect(requiredMessages.last()).toBeVisible();
      await expect(
        authedPage.getByRole("heading", { name: "Frontend prep" }),
      ).not.toBeVisible();
    },
  );

  authedTest.use({ authEmailPrefix: "edit-job-info-" });
  authedTest(
    "user can open existing job info, change fields, save",
    async ({ authedPage, session }) => {
      const updatedJobInfo = {
        name: "Frontend position",
        title: "Middle Frontend Engineer",
        experienceLevel: "Mid-Level",
        description: "React, Next.js, and React Native interview preparation.",
      };

      // Create job info
      const jobInfo = await createTestJobInfo(session.userId);

      // Go to job info page
      await openJobInfoFromApp(authedPage, jobInfo.id);

      // Go to edit job info page
      await expect(
        authedPage.getByRole("link", { name: "Update Job Description" }),
      ).toBeVisible();
      await Promise.all([
        authedPage.waitForURL(jobInfoUrlPattern("/edit")),
        authedPage
          .getByRole("link", { name: "Update Job Description" })
          .click(),
      ]);

      // Change job info details
      const nameInput = authedPage.getByRole("textbox", { name: "Name" });
      const titleInput = authedPage.getByRole("textbox", { name: "Job Title" });
      const descriptionInput = authedPage.getByRole("textbox", {
        name: "Description",
      });
      const experienceLevelInput = authedPage.getByRole("combobox", {
        name: "Experience Level",
      });

      await nameInput.click();
      await nameInput.fill(updatedJobInfo.name);
      await titleInput.fill(updatedJobInfo.title);
      await descriptionInput.fill(updatedJobInfo.description);
      await experienceLevelInput.click();
      await authedPage
        .getByRole("option", { name: updatedJobInfo.experienceLevel })
        .click();

      await Promise.all([
        authedPage.waitForURL(jobInfoUrlPattern()),
        authedPage
          .getByRole("button", { name: "Save job information" })
          .click(),
      ]);

      // Ensure user sees updated job info
      await expect(authedPage).toHaveURL(jobInfoUrlPattern());
      await expect(authedPage.getByRole("heading")).toHaveText(
        updatedJobInfo.name,
      );
      await expect(authedPage.getByText(updatedJobInfo.title)).toBeVisible();
      await expect(
        authedPage.getByText(updatedJobInfo.experienceLevel),
      ).toBeVisible();
    },
  );

  authedTest.use({ authEmailPrefix: "delete-job-info-" });
  authedTest("user can delete a job info", async ({ authedPage, session }) => {
    // Create job info
    const jobInfoInput = {
      name: "Frontend prep",
      description: "React and Next.js interview preparation.",
    };
    const jobInfo = await createTestJobInfo(session.userId, jobInfoInput);

    // Delete job info
    await authedPage.goto("/app");
    await expect(authedPage.getByTestId(jobInfo.id)).toBeVisible();
    await authedPage.getByRole("button", { name: "Delete job info" }).click();

    await expect(authedPage.getByRole("alertdialog")).toBeVisible();
    await expect(
      authedPage.getByRole("heading", { name: "Are you sure?" }),
    ).toBeVisible();

    await authedPage.getByRole("button", { name: "Yes" }).click();

    // Ensure job info is deleted
    await expect(authedPage.getByTestId(jobInfo.id)).toBeHidden();
  });

  jobInfoSections.forEach(
    ({ sectionName, sectionLink, sectionHeading, assert, checkElement }) => {
      authedTest.use({ authEmailPrefix: `visit-${sectionName}-section-` });
      authedTest(
        `user can visit ${sectionHeading} section of a job info`,
        async ({ authedPage, session }) => {
          const jobInfo = await createTestJobInfo(session.userId);

          await openJobInfoFromApp(authedPage, jobInfo.id);

          await Promise.all([
            authedPage.waitForURL(jobInfoUrlPattern(`/${sectionName}`)),
            authedPage.getByRole("link", { name: sectionLink }).click(),
          ]);

          await expect(authedPage).toHaveURL(
            jobInfoUrlPattern(`/${sectionName}`),
          );

          await expectSectionContent(authedPage, { assert, checkElement });
        },
      );
    },
  );

  authedTest.use({ authEmailPrefix: "visit-upgrade-page-" });
  authedTest("user can visit Upgrade page", async ({ authedPage }) => {
    // Visit Upgrade page
    await authedPage.goto("/app");

    await Promise.all([
      authedPage.waitForURL("/app/upgrade"),
      authedPage.getByRole("link", { name: "Upgrade plan" }).click(),
    ]);

    await expect(
      authedPage.getByRole("heading", { name: "Upgrade your plan" }),
    ).toBeVisible();
    await expect(
      authedPage.getByRole("button", { name: "Current plan" }),
    ).toBeVisible();
    await expect(
      authedPage.getByRole("button", { name: "Upgrade to Pro" }),
    ).toBeVisible();
  });
});
