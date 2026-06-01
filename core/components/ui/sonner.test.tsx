jest.mock("next-themes", () => ({
  useTheme: jest.fn(),
}));

jest.mock("sonner", () => ({
  Toaster: jest.fn(() => null),
}));

import { render } from "@testing-library/react";
import { isValidElement } from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

import { Toaster } from "./sonner";

const mockUseTheme = jest.mocked(useTheme);
const mockSonner = jest.mocked(Sonner);

function createThemeResult(theme?: string): ReturnType<typeof useTheme> {
  return {
    forcedTheme: undefined,
    resolvedTheme: theme,
    setTheme: jest.fn(),
    systemTheme: undefined,
    theme,
    themes: ["light", "dark", "system"],
  };
}

describe("Toaster", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes the active theme, icons, style variables, and caller props to Sonner", () => {
    mockUseTheme.mockReturnValue(createThemeResult("dark"));

    render(<Toaster closeButton position="bottom-right" />);

    expect(mockSonner).toHaveBeenCalledTimes(1);

    const props = mockSonner.mock.calls[0][0];

    expect(props).toMatchObject({
      className: "toaster group",
      closeButton: true,
      position: "bottom-right",
      theme: "dark",
    });
    expect(props.style).toMatchObject({
      "--border-radius": "var(--radius)",
      "--normal-bg": "var(--popover)",
      "--normal-border": "var(--border)",
      "--normal-text": "var(--popover-foreground)",
    });
    expect(isValidElement(props.icons?.success)).toBe(true);
    expect(isValidElement(props.icons?.info)).toBe(true);
    expect(isValidElement(props.icons?.warning)).toBe(true);
    expect(isValidElement(props.icons?.error)).toBe(true);
    expect(isValidElement(props.icons?.loading)).toBe(true);
  });

  it("falls back to the system theme when the provider has no theme", () => {
    mockUseTheme.mockReturnValue(createThemeResult());

    render(<Toaster />);

    expect(mockSonner.mock.calls[0][0].theme).toBe("system");
  });
});
