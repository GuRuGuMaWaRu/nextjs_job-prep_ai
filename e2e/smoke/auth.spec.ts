import { test, expect } from "@playwright/test";

import {
  createAuthenticatedUser,
  applySessionCookie,
} from "../helpers/createUser";

test.describe("Auth", () => {
  test("a new user creates an account on Sign Up page and is forwarded to the main page", async ({
    page,
  }) => {
    const email = `e2e-${Date.now()}@test.local`;

    await page.goto("/sign-up");
    await page.getByRole("textbox", { name: /name/i }).fill("Test User");
    await page.getByRole("textbox", { name: /email/i }).fill(email);
    await page.getByRole("textbox", { name: /password/i }).fill("password1");

    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page).toHaveURL("/app");
    await expect(
      page.getByRole("button", { name: /save job information/i }),
    ).toBeVisible();
  });

  test("a user can sign up, log out, and then sign in with the same credentials", async ({
    page,
  }) => {
    const email = `e2e-${Date.now()}@test.local`;
    const password = "password1";

    // Sign up
    await page.goto("/sign-up");
    await page.getByRole("textbox", { name: /name/i }).fill("Test User");
    await page.getByRole("textbox", { name: /email/i }).fill(email);
    await page.getByRole("textbox", { name: /password/i }).fill(password);
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page).toHaveURL("/app");
    await expect(
      page.getByRole("button", { name: /save job information/i }),
    ).toBeVisible();

    // Log out
    await page.getByTestId("navbar-user-menu").click();
    await page.getByRole("button", { name: /logout/i }).click();

    await expect(page).toHaveURL("/");

    // Sign in
    await page.goto("/sign-in");
    await page.getByRole("textbox", { name: /email/i }).fill(email);
    await page.getByRole("textbox", { name: /password/i }).fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();

    // Get sent to App
    await expect(page).toHaveURL("/app");
    await expect(
      page.getByRole("button", { name: /save job information/i }),
    ).toBeVisible();
  });

  test("a signed out user signs in via Sign In page and is forwarded to the main page", async ({
    page,
  }) => {
    const session = await createAuthenticatedUser("auth-main-");

    await page.goto("/sign-in");

    await page.getByRole("textbox", { name: /email/i }).fill(session.email);
    await page
      .getByRole("textbox", { name: /password/i })
      .fill(session.password);

    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL("/app");
    await expect(
      page.getByRole("button", { name: /save job information/i }),
    ).toBeVisible();
  });

  test("when trying to access App page a signed out user is redirected to Sign In page ", async ({
    page,
  }) => {
    await page.goto("/app");

    await expect(page).toHaveURL("/sign-in");
  });

  test("when a signed in user logs out and tries to access App pages he is redirected to Sgn In page", async ({
    page,
  }) => {
    const session = await createAuthenticatedUser("auth-main-");
    await applySessionCookie(page, session);

    await page.goto("/app");

    await expect(page).toHaveURL("/app");

    await page.getByTestId("navbar-user-menu").click();
    await page.getByRole("button", { name: /logout/i }).click();

    await expect(page).toHaveURL("/");

    await page.goto("/app");

    await expect(page).toHaveURL("/sign-in");
  });
});
