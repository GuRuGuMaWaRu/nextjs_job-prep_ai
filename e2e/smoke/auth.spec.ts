import { test, expect } from "@playwright/test";

import {
  createAuthenticatedUser,
  applySessionCookie,
} from "../helpers/createUser";
import { signInViaUI, signUpViaUI } from "../helpers/authViaUi";

test.describe("Auth", () => {
  test("a new user creates an account on Sign Up page and is forwarded to the main page", async ({
    page,
  }) => {
    const email = `e2e-${Date.now()}@test.local`;

    await signUpViaUI(page, {
      email,
      password: "password1",
      name: "Test User",
    });

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
    await signUpViaUI(page, {
      email,
      password,
      name: "Test User",
    });

    await expect(page).toHaveURL("/app");
    await expect(
      page.getByRole("button", { name: /save job information/i }),
    ).toBeVisible();

    // Log out
    await page.getByTestId("navbar-user-menu").click();
    await page.getByRole("button", { name: /logout/i }).click();

    await expect(page).toHaveURL("/");

    // Sign in
    await signInViaUI(page, { email, password });

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

    await signInViaUI(page, {
      email: session.email,
      password: session.password,
    });

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
