import { render, screen } from "@testing-library/react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

describe("Card", () => {
  it("renders card sections with their slot attributes and content", () => {
    render(
      <Card aria-label="Interview prep card" className="custom-card">
        <CardHeader className="custom-header">
          <CardTitle className="custom-title">Behavioral practice</CardTitle>
          <CardDescription className="custom-description">
            Review common prompts
          </CardDescription>
          <CardAction className="custom-action">
            <button type="button">Start</button>
          </CardAction>
        </CardHeader>
        <CardContent className="custom-content">
          Two questions are ready.
        </CardContent>
        <CardFooter className="custom-footer">Updated today</CardFooter>
      </Card>,
    );

    const card = screen.getByLabelText("Interview prep card");
    const header = screen.getByText("Behavioral practice").parentElement;
    const title = screen.getByText("Behavioral practice");
    const description = screen.getByText("Review common prompts");
    const action = screen.getByRole("button", { name: "Start" }).parentElement;
    const content = screen.getByText("Two questions are ready.");
    const footer = screen.getByText("Updated today");

    expect(card).toHaveAttribute("data-slot", "card");
    expect(card).toHaveClass("custom-card");
    expect(header).toHaveAttribute("data-slot", "card-header");
    expect(header).toHaveClass("custom-header");
    expect(title).toHaveAttribute("data-slot", "card-title");
    expect(title).toHaveClass("custom-title");
    expect(description).toHaveAttribute("data-slot", "card-description");
    expect(description).toHaveClass("custom-description");
    expect(action).toHaveAttribute("data-slot", "card-action");
    expect(action).toHaveClass("custom-action");
    expect(content).toHaveAttribute("data-slot", "card-content");
    expect(content).toHaveClass("custom-content");
    expect(footer).toHaveAttribute("data-slot", "card-footer");
    expect(footer).toHaveClass("custom-footer");
  });
});
