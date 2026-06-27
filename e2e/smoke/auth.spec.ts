import { randomUUID } from "crypto";
import { test, expect } from "@playwright/test";

import {
  createAuthenticatedUser,
  applySessionCookie,
  signInViaUI,
  signUpViaUI,
  logOutViaUI,
  expectAppHome,
} from "../helpers";

test.describe("Auth", () => {
  test.describe.configure({ mode: "serial" });

  test("a new user creates an account on Sign Up page and is forwarded to the main page", async ({
    page,
  }) => {
    const email = `e2e-${randomUUID()}@test.local`;

    await signUpViaUI(page, {
      email,
      password: "password1",
      name: "Test User",
    });

    await expectAppHome(page);
  });

  test("a user can sign up, log out, and then sign in with the same credentials", async ({
    page,
  }) => {
    const email = `e2e-${randomUUID()}@test.local`;
    const password = "password1";

    // Sign up
    await signUpViaUI(page, {
      email,
      password,
      name: "Test User",
    });

    await expectAppHome(page);

    // Log out
    await logOutViaUI(page);
    await expect(page).toHaveURL("/");

    // Sign in
    await signInViaUI(page, { email, password });

    // Get sent to App
    await expectAppHome(page);
  });

  test("a signed out user signs in via Sign In page and is forwarded to the main page", async ({
    page,
  }) => {
    const session = await createAuthenticatedUser("auth-signin-");

    await signInViaUI(page, {
      email: session.email,
      password: session.password,
    });

    await expectAppHome(page);
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
    // Log in
    const session = await createAuthenticatedUser(
      "auth-signin-signout-signin-",
    );
    await applySessionCookie(page, session);
    await page.goto("/app");

    await expectAppHome(page);

    // Logout
    await logOutViaUI(page);
    await expect(page).toHaveURL("/");

    // Try visiting app again
    await page.goto("/app");

    await expect(page).toHaveURL("/sign-in");
  });
});
