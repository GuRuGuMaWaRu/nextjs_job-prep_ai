import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

import { jobInfoSchema } from "@/core/features/jobInfos/schemas";

export async function createTestJobInfoUI(
  page: Page,
  overrides: Partial<typeof jobInfoSchema> = {},
) {
  const jobInfoInput = {
    name: "Frontend prep",
    title: "Senior Frontend Engineer",
    experienceLevel: "Senior",
    description: "React and Next.js interview preparation.",
    ...overrides,
  };

  // Go to Create New Job Description page
  await page.goto("/app");
  await expect(
    page.getByRole("button", { name: /save job information/i }),
  ).toBeVisible();

  // Submit a new job info
  const nameInput = page.getByRole("textbox", { name: "Name" });
  const titleInput = page.getByRole("textbox", { name: "Job Title" });
  const descriptionInput = page.getByRole("textbox", { name: "Description" });

  await nameInput.click();
  await nameInput.fill(jobInfoInput.name);
  await titleInput.fill(jobInfoInput.title);
  await descriptionInput.fill(jobInfoInput.description);

  await page.getByRole("combobox", { name: "Experience Level" }).click();
  await page
    .getByRole("option", { name: jobInfoInput.experienceLevel })
    .click();

  await expect(nameInput).toHaveValue(jobInfoInput.name);
  await expect(titleInput).toHaveValue(jobInfoInput.title);
  await expect(descriptionInput).toHaveValue(jobInfoInput.description);

  // Check if we are redirected to a newly created job description
  await Promise.all([
    page.waitForURL(/\/app\/jobInfo\/[0-9a-f-]{36}$/),
    page.getByRole("button", { name: /save job information/i }).click(),
  ]);
}
