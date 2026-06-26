import { test, expect } from "@playwright/test";

import {
  createAuthenticatedUser,
  applySessionCookie,
  expectAppHome,
  createTestJobInfo,
  createTestJobInfoUI,
} from "../helpers";

test.describe("User Flow ->", () => {
  test("signed-in user sees upgrade link in navbar", async ({ page }) => {
    const session = await createAuthenticatedUser("user-flow-plan-ui-");
    await applySessionCookie(page, session);
    await page.goto("/app");

    await expectAppHome(page);
    await expect(page.getByText(/current plan/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /upgrade plan/i }),
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
    await page.goto("/app");
    const jobInfoCard = page.getByTestId(jobInfo.id);
    await Promise.all([
      page.waitForURL(/\/app\/jobInfo\/[0-9a-f-]{36}$/),
      jobInfoCard.getByRole("link").click(),
    ]);

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
      page.getByRole("button", { name: /save job information/i }).click(),
    ]);

    // Ensure user sees updated job info
    await expect(page).toHaveURL(/\/app\/jobInfo\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading")).toHaveText(updatedJobInfo.name);
    await expect(page.getByText(updatedJobInfo.title)).toBeVisible();
    await expect(page.getByText(updatedJobInfo.experienceLevel)).toBeVisible();
  });

  test("signed-in user can create a job info and delete it", async ({
    page,
  }) => {
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
    await createTestJobInfoUI(page, jobInfoInput);

    // Delete job info
    await page.goto("/app");
    await expect(page.locator(".job-info-card")).toHaveCount(1);
    await page.getByLabel("Delete job info").click();

    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Are you sure?" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Yes " }).click();

    // Ensure job info is deleted
    await expect(page.locator(".job-info-card")).toHaveCount(0);
  });

  test("signed-in user can visit Interviews section of a job info", async ({
    page,
  }) => {
    // Set up a user
    const session = await createAuthenticatedUser("visit-interviews-section-");
    await applySessionCookie(page, session);

    // Create job info
    await createTestJobInfoUI(page);

    // Go to Interviews section
    await expect(
      page.getByRole("link", { name: "Practice Interviewing" }),
    ).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/app\/jobInfo\/[0-9a-f-]{36}\/interviews$/),
      page.getByRole("link", { name: "Practice Interviewing" }).click(),
    ]);

    // Ensure Interviews section is displayed
    await expect(page).toHaveURL(/\/app\/jobInfo\/[0-9a-f-]{36}\/interviews$/);
    await expect(
      page.getByRole("heading", { name: "Interviews" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "New Interview" }),
    ).toBeVisible();
  });

  test("signed-in user can visit Questions section of a job info", async ({
    page,
  }) => {
    // Set up a user
    const session = await createAuthenticatedUser("visit-questions-section-");
    await applySessionCookie(page, session);

    // Create job info
    await createTestJobInfoUI(page);

    // Go to Questions section
    await expect(
      page.getByRole("link", { name: "Answer Technical Questions" }),
    ).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/app\/jobInfo\/[0-9a-f-]{36}\/questions$/),
      page.getByRole("link", { name: "Answer Technical Questions" }).click(),
    ]);

    // Ensure Questions section is displayed
    await expect(page).toHaveURL(/\/app\/jobInfo\/[0-9a-f-]{36}\/questions$/);
    await expect(page.getByRole("button", { name: "Easy" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Medium" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Hard" })).toBeVisible();
    await expect(
      page.getByText("Get started by selecting a question difficulty above."),
    ).toBeVisible();
  });

  test("signed-in user can visit Resume section of a job info", async ({
    page,
  }) => {
    // Set up a user
    const session = await createAuthenticatedUser("visit-resume-section-");
    await applySessionCookie(page, session);

    // Create job info
    await createTestJobInfoUI(page);

    // Go to Resume section
    await expect(
      page.getByRole("link", { name: "Analyze Your Resume" }),
    ).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/app\/jobInfo\/[0-9a-f-]{36}\/resume$/),
      page.getByRole("link", { name: "Analyze Your Resume" }).click(),
    ]);

    // Ensure Resume section is displayed
    await expect(page).toHaveURL(/\/app\/jobInfo\/[0-9a-f-]{36}\/resume$/);
    await expect(page.getByLabel("Upload your resume")).toBeVisible();
  });
});
