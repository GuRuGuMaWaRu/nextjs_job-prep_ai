import { render, screen } from "@testing-library/react";

import { Badge, badgeVariants } from "./badge";

describe("Badge", () => {
  it("renders a default badge and forwards span props", () => {
    render(
      <Badge aria-label="Current plan" className="custom-badge">
        Pro
      </Badge>,
    );

    const badge = screen.getByLabelText("Current plan");

    expect(badge).toHaveAttribute("data-slot", "badge");
    expect(badge.tagName).toBe("SPAN");
    expect(badge).toHaveClass("custom-badge");
    expect(badge).toHaveClass("bg-primary");
    expect(badge).toHaveTextContent("Pro");
  });

  it("applies the selected variant classes", () => {
    render(<Badge variant="warning">Expiring soon</Badge>);

    const badge = screen.getByText("Expiring soon");

    expect(badge).toHaveClass("bg-warning");
    expect(badge).toHaveClass("text-white");
  });

  it("renders as a child element while preserving badge attributes", () => {
    render(
      <Badge asChild variant="outline">
        <a href="/app/upgrade">Upgrade</a>
      </Badge>,
    );

    const link = screen.getByRole("link", { name: "Upgrade" });

    expect(link).toHaveAttribute("href", "/app/upgrade");
    expect(link).toHaveAttribute("data-slot", "badge");
    expect(link).toHaveClass("text-foreground");
  });
});

describe("badgeVariants", () => {
  it("returns default and custom variant class names", () => {
    expect(badgeVariants()).toContain("bg-primary");
    expect(badgeVariants({ variant: "primary" })).toContain(
      "bg-positive-badge-background",
    );
  });
});
