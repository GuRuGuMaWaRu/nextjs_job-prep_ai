import { test, expect } from "@playwright/test";

import {
  createAuthenticatedUser,
  applySessionCookie,
  expectAppHome,
  createTestJobInfo,
  createTestJobInfoUI,
  openJobInfoFromApp,
} from "../helpers";

test.describe("User Flow ->", () => {
  test("signed-in user sees upgrade link in navbar", async ({ page }) => {
    const session = await createAuthenticatedUser("user-flow-plan-ui-");
    await applySessionCookie(page, session);
    await page.goto("/app");

    await expectAppHome(page);
    await expect(page.getByText("Current plan")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Upgrade plan" }),
    ).toBeVisible();
  });

  test("signed-in user can create a job info and see it on the main page", async ({
    page,
  }) => {
    // Set up a user
    const session = await createAuthenticatedUser("create-job-info-");
    await applySessionCookie(page, session);

    // Create job info
    const jobInfoInput = {
      name: "Frontend prep",
      description: "React and Next.js interview preparation.",
    };
    await createTestJobInfoUI(page, jobInfoInput);

    // Ensure job info exists
    await expect(
      page.getByRole("heading", { name: jobInfoInput.name }),
    ).toBeVisible();
    await expect(page.getByText(jobInfoInput.description)).toBeVisible();
  });

  test("signed-in user can open existing job info, change fields, save", async ({
    page,
  }) => {
    const updatedJobInfo = {
      name: "Frontend position",
      title: "Middle Frontend Engineer",
      experienceLevel: "Mid-Level",
      description: "React, Next.js, and React Native interview preparation.",
    };

    // Create job info
    const session = await createAuthenticatedUser("create-and-edit-job-info-");
    await applySessionCookie(page, session);
    const jobInfo = await createTestJobInfo(session.userId);

    // Go to job info page
    await openJobInfoFromApp(page, jobInfo.id);

    // Go to edit job info page
    await expect(
      page.getByRole("link", { name: "Update Job Description" }),
    ).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/app\/jobInfo\/[0-9a-f-]{36}\/edit$/),
      page.getByRole("link", { name: "Update Job Description" }).click(),
    ]);

    // Change job info details
    const nameInput = page.getByRole("textbox", { name: "Name" });
    const titleInput = page.getByRole("textbox", { name: "Job Title" });
    const descriptionInput = page.getByRole("textbox", { name: "Description" });
    const experienceLevelInput = page.getByRole("combobox", {
      name: "Experience Level",
    });

    await nameInput.click();
    await nameInput.fill(updatedJobInfo.name);
    await titleInput.fill(updatedJobInfo.title);
    await descriptionInput.fill(updatedJobInfo.description);
    await experienceLevelInput.click();
    await page
      .getByRole("option", { name: updatedJobInfo.experienceLevel })
      .click();

    await expect(nameInput).toHaveValue(updatedJobInfo.name);
    await expect(titleInput).toHaveValue(updatedJobInfo.title);
    await expect(descriptionInput).toHaveValue(updatedJobInfo.description);

    await Promise.all([
      page.waitForURL(/\/app\/jobInfo\/[0-9a-f-]{36}$/),
      page.getByRole("button", { name: "Save job information" }).click(),
    ]);

    // Ensure user sees updated job info
    await expect(page).toHaveURL(/\/app\/jobInfo\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading")).toHaveText(updatedJobInfo.name);
    await expect(page.getByText(updatedJobInfo.title)).toBeVisible();
    await expect(page.getByText(updatedJobInfo.experienceLevel)).toBeVisible();
  });

  test("signed-in user can delete a job info", async ({ page }) => {
    // Set up a user
    const session = await createAuthenticatedUser(
      "create-and-delete-job-info-",
    );
    await applySessionCookie(page, session);

    // Create job info
    const jobInfoInput = {
      name: "Frontend prep",
      description: "React and Next.js interview preparation.",
    };
    const jobInfo = await createTestJobInfo(session.userId, jobInfoInput);

    // Delete job info
    await page.goto("/app");
    await expect(page.getByTestId(jobInfo.id)).toBeVisible();
    await page.getByRole("button", { name: "Delete job info" }).click();

    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Are you sure?" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Yes" }).click();

    // Ensure job info is deleted
    await expect(page.getByTestId(jobInfo.id)).toBeHidden();
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
    test(`signed-in user can visit ${sectionHeading} section of a job info`, async ({
      page,
    }) => {
      // Set up a user
      const session = await createAuthenticatedUser(
        `visit-${sectionName}-section-`,
      );
      await applySessionCookie(page, session);

      // Create job info
      const jobInfo = await createTestJobInfo(session.userId);

      // Go to job info page
      await openJobInfoFromApp(page, jobInfo.id);

      // Go to section
      await Promise.all([
        page.waitForURL(
          new RegExp(`\/app\/jobInfo\/[0-9a-f-]{36}\/${sectionName}$`),
        ),
        page.getByRole("link", { name: sectionLink }).click(),
      ]);

      // Ensure section is displayed
      await expect(page).toHaveURL(
        new RegExp(`\/app\/jobInfo\/[0-9a-f-]{36}\/${sectionName}$`),
      );

      if (sectionName === "interviews") {
        await expect(
          page.getByRole("heading", { name: checkElement }),
        ).toBeVisible();
      }

      if (sectionName === "questions") {
        await expect(page.getByText(checkElement)).toBeVisible();
      }

      if (sectionName === "resume") {
        await expect(page.getByLabel(checkElement)).toBeVisible();
      }
    });
  });

  test("signed-in user can visit Upgrade page", async ({ page }) => {
    // Set up a user
    const session = await createAuthenticatedUser("visit-upgrade-page-");
    await applySessionCookie(page, session);

    // Visit Upgrade page
    await page.goto("/app");

    await Promise.all([
      page.waitForURL("/app/upgrade"),
      page.getByRole("link", { name: "Upgrade plan" }).click(),
    ]);

    await expect(
      page.getByRole("heading", { name: "Upgrade your plan" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Current plan" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Upgrade to Pro" }),
    ).toBeVisible();
  });
});
