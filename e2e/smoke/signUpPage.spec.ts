import { test, expect } from "@playwright/test";

test.describe("Sign-up page", () => {
  test("creates an account and forwards a new user to welcome page", async ({
    page,
  }) => {
    const email = `e2e-${Date.now()}@test.local`;

    await page.goto("/sign-up");
    await page.getByRole("textbox", { name: /name/i }).fill("Test User");
    await page.getByRole("textbox", { name: /email/i }).fill(email);
    await page.getByRole("textbox", { name: /password/i }).fill("password1");

    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page).toHaveURL("/app");
    await expect(page.getByRole("heading")).toHaveText(/Welcome to OfferPilot/);
    await expect(
      page.getByRole("button", { name: /save job information/i }),
    ).toBeVisible();
  });
});
