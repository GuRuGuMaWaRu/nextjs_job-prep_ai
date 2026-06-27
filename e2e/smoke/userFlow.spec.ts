import { expect } from "@playwright/test";

import { authedTest } from "../fixtures/auth";
import {
  expectAppHome,
  createTestJobInfo,
  createTestJobInfoUI,
  openJobInfoFromApp,
} from "../helpers";

const JOB_INFO_URL = "/app/jobInfo/[0-9a-f-]{36}";

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
        authedPage.waitForURL(new RegExp(`${JOB_INFO_URL}\/edit$`)),
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

      await expect(nameInput).toHaveValue(updatedJobInfo.name);
      await expect(titleInput).toHaveValue(updatedJobInfo.title);
      await expect(descriptionInput).toHaveValue(updatedJobInfo.description);

      await Promise.all([
        authedPage.waitForURL(new RegExp(`${JOB_INFO_URL}$`)),
        authedPage
          .getByRole("button", { name: "Save job information" })
          .click(),
      ]);

      // Ensure user sees updated job info
      await expect(authedPage).toHaveURL(new RegExp(`${JOB_INFO_URL}$`));
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

  [
    {
      sectionName: "interviews",
      sectionLink: "Practice Interviewing",
      sectionHeading: "Interviews",
      checkElement: "Interviews",
    },
    {
      sectionName: "questions",
      sectionLink: "Answer Technical Questions",
      sectionHeading: "Questions",
      checkElement: "Get started by selecting a question difficulty above.",
    },
    {
      sectionName: "resume",
      sectionLink: "Analyze Your Resume",
      sectionHeading: "Resume",
      checkElement: "Upload your resume",
    },
  ].forEach(({ sectionName, sectionLink, sectionHeading, checkElement }) => {
    authedTest.use({ authEmailPrefix: `visit-${sectionName}-section-` });
    authedTest(
      `user can visit ${sectionHeading} section of a job info`,
      async ({ authedPage, session }) => {
        // Create job info
        const jobInfo = await createTestJobInfo(session.userId);

        // Go to job info page
        await openJobInfoFromApp(authedPage, jobInfo.id);

        // Go to section
        await Promise.all([
          authedPage.waitForURL(new RegExp(`${JOB_INFO_URL}\/${sectionName}$`)),
          authedPage.getByRole("link", { name: sectionLink }).click(),
        ]);

        // Ensure section is displayed
        await expect(authedPage).toHaveURL(
          new RegExp(`${JOB_INFO_URL}\/${sectionName}$`),
        );

        if (sectionName === "interviews") {
          await expect(
            authedPage.getByRole("heading", { name: checkElement }),
          ).toBeVisible();
        }

        if (sectionName === "questions") {
          await expect(authedPage.getByText(checkElement)).toBeVisible();
        }

        if (sectionName === "resume") {
          await expect(authedPage.getByLabel(checkElement)).toBeVisible();
        }
      },
    );
  });

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
