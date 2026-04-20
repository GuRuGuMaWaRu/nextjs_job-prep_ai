import { render, screen } from "@testing-library/react";

import { BackLink } from "./BackLink";

describe("BackLink", () => {
  it("renders children inside a link pointing to href", () => {
    const label = "Back to dashboard";
    const href = "/dashboard";

    render(<BackLink href={href}>{label}</BackLink>);

    const link = screen.getByRole("link", { name: label });

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", href);
  });

  it("applies a custom className to the rendered link", () => {
    const label = "Back";
    const href = "/x";
    const customClass = "custom-class";

    render(
      <BackLink href={href} className={customClass}>
        {label}
      </BackLink>,
    );

    const link = screen.getByRole("link", { name: label });

    expect(link).toHaveAttribute("href", href);
    expect(link).toHaveClass(customClass);
  });
});
