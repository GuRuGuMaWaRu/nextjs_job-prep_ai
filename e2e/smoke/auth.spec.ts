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

    // Submit a new job info
    const nameInput = page.getByRole("textbox", { name: "Name" });
    const titleInput = page.getByRole("textbox", { name: "Job Title" });
    const descriptionInput = page.getByRole("textbox", { name: "Description" });

    await nameInput.click();
    await nameInput.fill(jobInfoInput.name);
    await titleInput.fill(jobInfoInput.title);
    await descriptionInput.fill(jobInfoInput.description);

    await page.getByRole("combobox", { name: "Experience Level" }).click();
    await page
      .getByRole("option", { name: jobInfoInput.experienceLevel })
      .click();

    await expect(nameInput).toHaveValue(jobInfoInput.name);
    await expect(titleInput).toHaveValue(jobInfoInput.title);
    await expect(descriptionInput).toHaveValue(jobInfoInput.description);

    // Check if we are redirected to a newly created job description
    await Promise.all([
      page.waitForURL(/\/app\/jobInfo\/[0-9a-f-]{36}$/),
      page.getByRole("button", { name: /save job information/i }).click(),
    ]);

    await expect(
      page.getByRole("heading", { name: jobInfoInput.name }),
    ).toBeVisible();
    await expect(page.getByText(jobInfoInput.description)).toBeVisible();
  });
});
