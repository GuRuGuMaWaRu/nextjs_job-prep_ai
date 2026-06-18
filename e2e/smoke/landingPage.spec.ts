import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
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

  test("should show a sign up button", async ({ page }) => {
    await page.goto("/");

    const signUpLink = page.getByRole("link", {
      name: /get started for free/i,
    });

    await expect(signUpLink).toBeVisible();
  });

  test("should show a sign in button in navbar", async ({ page }) => {
    await page.goto("/");

    const signInLink = page.getByRole("link", {
      name: /sign in/i,
    });

    await expect(signInLink).toBeVisible();
  });

  test("should allow going to Sign Up page", async ({ page }) => {
    await page.goto("/");

    await page
      .getByRole("link", {
        name: /get started for free/i,
      })
      .click();

    await expect(page).toHaveURL("/sign-up");
    await expect(page.getByRole("textbox", { name: /name/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: /password/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /create account/i }),
    ).toBeVisible();
  });

  test("should allow going to Sign In page", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: /sign in/i }).click();

    await expect(page).toHaveURL("/sign-in");
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: /password/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });
});
