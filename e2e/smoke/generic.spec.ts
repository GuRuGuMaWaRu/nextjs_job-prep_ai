import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should display page title", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle("OfferPilot");
  });

  test("should display the hero section", async ({ page }) => {
    await page.goto("/");

    const heroTitle = page.locator("h1");

    await expect(heroTitle).toHaveText(
      "Master Your Job Interview with AI-Powered Preparation",
    );
  });

  test("should show a sign up link", async ({ page }) => {
    await page.goto("/");

    const signUpLink = page.getByRole("link", {
      name: /get started for free/i,
    });

    await expect(signUpLink).toBeVisible();
  });
});
