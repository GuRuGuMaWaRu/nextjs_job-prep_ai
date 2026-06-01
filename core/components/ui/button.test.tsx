import { render, screen } from "@testing-library/react";

import { Button, buttonVariants } from "./button";

describe("Button", () => {
  it("renders a default button and forwards button props", () => {
    render(
      <Button
        aria-label="Save changes"
        className="custom-button"
        disabled
        type="submit"
      >
        Save
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Save changes" });

    expect(button).toHaveAttribute("data-slot", "button");
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("custom-button");
    expect(button).toHaveClass("bg-primary");
    expect(button).toHaveClass("h-9");
    expect(button).toHaveTextContent("Save");
  });

  it("applies the selected variant and size classes", () => {
    render(
      <Button size="icon-lg" variant="destructive">
        Delete
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Delete" });

    expect(button).toHaveClass("bg-destructive");
    expect(button).toHaveClass("size-10");
  });

  it("renders as a child element while preserving button attributes", () => {
    render(
      <Button asChild size="sm" variant="link">
        <a href="/dashboard">Dashboard</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Dashboard" });

    expect(link).toHaveAttribute("href", "/dashboard");
    expect(link).toHaveAttribute("data-slot", "button");
    expect(link).toHaveClass("text-primary");
    expect(link).toHaveClass("h-8");
  });
});

describe("buttonVariants", () => {
  it("returns default and custom variant class names", () => {
    expect(buttonVariants()).toContain("bg-primary");
    expect(buttonVariants({ size: "lg", variant: "outline" })).toContain(
      "border",
    );
    expect(buttonVariants({ size: "lg", variant: "outline" })).toContain(
      "h-10",
    );
  });
});
