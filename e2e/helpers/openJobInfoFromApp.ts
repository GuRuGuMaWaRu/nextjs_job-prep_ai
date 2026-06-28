import type { Page } from "@playwright/test";

export async function openJobInfoFromApp(page: Page, jobInfoId: string) {
  await page.goto("/app");
  await Promise.all([
    page.waitForURL(/\/app\/jobInfo\/[0-9a-f-]{36}$/),
    page
      .getByTestId(jobInfoId)
      .getByRole("link", { name: "View job info" })
      .click(),
  ]);
}
