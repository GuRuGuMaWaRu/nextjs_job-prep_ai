import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

type SignInCredentials = {
  email: string;
  password: string;
};

type SignUpCredentials = {
  email: string;
  password: string;
  name: string;
};

export async function signInViaUI(
  page: Page,
  { email, password }: SignInCredentials,
) {
  await page.goto("/sign-in");
  await page.getByRole("textbox", { name: /email/i }).fill(email);
  await page.getByRole("textbox", { name: /password/i }).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
}

export async function signUpViaUI(
  page: Page,
  { email, password, name }: SignUpCredentials,
) {
  await page.goto("/sign-up");
  await page.getByRole("textbox", { name: /name/i }).fill(name);
  await page.getByRole("textbox", { name: /email/i }).fill(email);
  await page.getByRole("textbox", { name: /password/i }).fill(password);
  await page.getByRole("button", { name: /create account/i }).click();
}

export async function logOutViaUI(page: Page) {
  await page.getByTestId("navbar-user-menu").click();
  await expect(page.getByRole("button", { name: /logout/i })).toBeVisible();
  await page.getByRole("button", { name: /logout/i }).click();
}
