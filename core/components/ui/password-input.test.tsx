import userEvent from "@testing-library/user-event";

import { render, screen } from "@/core/test-utils/render";

import { PasswordInput } from "./password-input";

describe("PasswordInput", () => {
  it("renders as a password field and forwards input props", () => {
    render(
      <PasswordInput
        aria-label="Account password"
        autoComplete="current-password"
        className="custom-password"
        defaultValue="secret"
        name="password"
      />,
    );

    const input = screen.getByLabelText("Account password");

    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("autocomplete", "current-password");
    expect(input).toHaveAttribute("name", "password");
    expect(input).toHaveClass("pr-10");
    expect(input).toHaveClass("custom-password");
    expect(input).toHaveValue("secret");
    expect(
      screen.getByRole("button", { name: "Show password" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles the password visibility control", async () => {
    const user = userEvent.setup();

    render(<PasswordInput aria-label="Account password" />);

    const input = screen.getByLabelText("Account password");
    const showButton = screen.getByRole("button", { name: "Show password" });

    await user.click(showButton);

    expect(input).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: "Hide password" }),
    ).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Hide password" }));

    expect(input).toHaveAttribute("type", "password");
    expect(
      screen.getByRole("button", { name: "Show password" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("disables both the input and visibility button", () => {
    render(<PasswordInput aria-label="Account password" disabled />);

    expect(screen.getByLabelText("Account password")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Show password" }),
    ).toBeDisabled();
  });
});
