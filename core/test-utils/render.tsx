import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";
import { ThemeProvider } from "next-themes";
import type { ReactElement, ReactNode } from "react";

import { Toaster } from "@core/components/ui/sonner";

type ProvidersProps = {
  children: ReactNode;
};

function AllProviders({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableColorScheme
      disableTransitionOnChange
      value={{ light: "light", dark: "dark" }}
    >
      {children}
      <Toaster position="bottom-right" />
    </ThemeProvider>
  );
}

/**
 * Renders `ui` wrapped in the same top-level providers as the root layout
 * (theme + toast host), so component tests behave like they run inside the
 * app shell.
 *
 * Re-export all of `@testing-library/react` here so tests can import `render`,
 * `screen`, `fireEvent`, etc. from a single module if they wish.
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
): RenderResult {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from "@testing-library/react";
