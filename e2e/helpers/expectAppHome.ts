import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

export async function expectAppHome(page: Page) {
  await expect(page).toHaveURL("/app");
  await expect(
    page.getByRole("button", { name: /save job information/i }),
  ).toBeVisible();
}
