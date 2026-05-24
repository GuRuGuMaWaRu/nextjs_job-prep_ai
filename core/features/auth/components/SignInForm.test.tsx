jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useActionState: jest.fn(),
}));

jest.mock("@/core/features/auth/actions", () => ({
  signInAction: jest.fn(),
}));

jest.mock("@/core/features/auth/components/OAuthQueryErrorBanner", () => ({
  OAuthQueryErrorBanner: jest.fn(({ formError }: { formError?: string }) =>
    formError == null ? null : <div data-testid="oauth-error">{formError}</div>,
  ),
}));

jest.mock("@/core/features/auth/components/OAuthSignInSection", () => ({
  OAuthSignInSection: jest.fn(
    ({
      configuredOAuthProviders,
      lastUsedOAuthProvider,
    }: {
      configuredOAuthProviders: string[];
      lastUsedOAuthProvider?: string;
    }) => (
      <div
        data-last-used-provider={lastUsedOAuthProvider}
        data-provider-count={configuredOAuthProviders.length}
        data-testid="oauth-section"
      />
    ),
  ),
}));

import { render, screen } from "@testing-library/react";
import { useActionState } from "react";

import { routes } from "@/core/data/routes";
import { signInAction } from "@/core/features/auth/actions";
import { OAuthQueryErrorBanner } from "@/core/features/auth/components/OAuthQueryErrorBanner";
import { OAuthSignInSection } from "@/core/features/auth/components/OAuthSignInSection";

import { SignInForm } from "./SignInForm";

const mockUseActionState = jest.mocked(useActionState);
const mockOAuthQueryErrorBanner = jest.mocked(OAuthQueryErrorBanner);
const mockOAuthSignInSection = jest.mocked(OAuthSignInSection);

const submitAction = jest.fn();

function mockSignInState(
  state: Parameters<typeof mockUseActionState>[1],
  isPending = false,
) {
  mockUseActionState.mockReturnValue([state, submitAction, isPending]);
}

describe("SignInForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignInState(null);
  });

  it("renders sign-in fields and passes OAuth provider state to the OAuth section", () => {
    render(
      <SignInForm
        configuredOAuthProviders={["google", "github"]}
        lastUsedOAuthProvider="github"
      />,
    );

    expect(mockUseActionState).toHaveBeenCalledWith(signInAction, null);
    expect(
      screen.getByText("Enter your email and password to sign in to your account"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    expect(screen.getByRole("button", { name: "Sign In" })).toBeEnabled();
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      routes.signUp,
    );
    expect(screen.getByTestId("oauth-section")).toHaveAttribute(
      "data-provider-count",
      "2",
    );
    expect(screen.getByTestId("oauth-section")).toHaveAttribute(
      "data-last-used-provider",
      "github",
    );
    expect(mockOAuthSignInSection).toHaveBeenCalledWith(
      {
        configuredOAuthProviders: ["google", "github"],
        lastUsedOAuthProvider: "github",
      },
      undefined,
    );
  });

  it("renders returned field values and validation errors", () => {
    mockSignInState({
      error: "Please correct the highlighted fields.",
      fields: { email: "candidate@test.local" },
      fieldErrors: {
        email: "Enter a valid email",
        password: "Password is required",
      },
    });

    render(<SignInForm configuredOAuthProviders={[]} />);

    expect(screen.getByLabelText("Email")).toHaveValue("candidate@test.local");
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(screen.getByTestId("oauth-error")).toHaveTextContent(
      "Please correct the highlighted fields.",
    );
    expect(mockOAuthQueryErrorBanner).toHaveBeenCalledWith(
      { formError: "Please correct the highlighted fields." },
      undefined,
    );
  });

  it("disables controls and shows pending copy while signing in", () => {
    mockSignInState(null, true);

    render(<SignInForm configuredOAuthProviders={[]} />);

    expect(screen.getByLabelText("Email")).toBeDisabled();
    expect(screen.getByLabelText("Password")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Show password" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Signing in..." })).toBeDisabled();
  });
});
