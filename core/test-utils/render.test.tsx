import { renderWithProviders, screen } from "./render";

describe("renderWithProviders", () => {
  it("renders children inside the theme provider shell", () => {
    renderWithProviders(<p>hello providers</p>);

    expect(screen.getByText("hello providers")).toBeInTheDocument();
  });

  it("accepts RTL render options except wrapper", () => {
    const container = document.createElement("section");
    document.body.appendChild(container);

    renderWithProviders(<span>scoped</span>, { container });

    expect(container).toHaveTextContent("scoped");
  });
});
