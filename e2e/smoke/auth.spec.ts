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
    const session = await createAuthenticatedUser("auth-signin-");

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
    const session = await createAuthenticatedUser(
      "auth-signin-signout-signin-",
    );
    await applySessionCookie(page, session);

    await page.goto("/app");

    await expect(page).toHaveURL("/app");

    await page.getByTestId("navbar-user-menu").click();
    await page.getByRole("button", { name: /logout/i }).click();

    await expect(page).toHaveURL("/");

    await page.goto("/app");

    await expect(page).toHaveURL("/sign-in");
  });

  test("a newly signed up user can add a new job description and see it on the main page", async ({
    page,
  }) => {
    const jobInfoInput = {
      name: "Frontend prep",
      title: "Senior Frontend Engineer",
      experienceLevel: "Senior",
      description: "React and Next.js interview preparation.",
    };

    const session = await createAuthenticatedUser("create-job-info-");
    await applySessionCookie(page, session);

    // Go to Create New Job Description page
    await page.goto("/app");
    await expect(
      page.getByRole("button", { name: /save job information/i }),
    ).toBeVisible();

    // Submit a new job description
    await page.getByLabel("Name").fill(jobInfoInput.name);
    await page.getByLabel("Job Title").fill(jobInfoInput.title);
    await page.getByLabel("Description").fill(jobInfoInput.description);

    await page.getByRole("combobox", { name: "Experience Level" }).click();
    await page
      .getByRole("option", { name: jobInfoInput.experienceLevel })
      .click();
    await page.getByRole("button", { name: /save job information/i }).click();

    // Check if we are redirected to a newly created job description
    await expect(page).toHaveURL(/\/app\/jobInfo\/[0-9a-f-]+$/);
    await expect(
      page.getByRole("heading", { name: jobInfoInput.name }),
    ).toBeVisible();
    await expect(page.getByText(jobInfoInput.description)).toBeVisible();
  });
});
