import { test, expect } from "@playwright/test";

import {
  createAuthenticatedUser,
  applySessionCookie,
  expectAppHome,
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
});
