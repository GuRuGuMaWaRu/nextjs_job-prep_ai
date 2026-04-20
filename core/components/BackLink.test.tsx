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

  it("renders with a custom className without breaking the link role", () => {
    const label = "Back";
    const href = "/x";

    render(
      <BackLink href={href} className="custom-class">
        {label}
      </BackLink>,
    );

    const link = screen.getByRole("link", { name: label });

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", href);
  });
});
