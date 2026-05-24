jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useActionState: jest.fn(),
}));

jest.mock("@/core/features/auth/actions", () => ({
  signUpAction: jest.fn(),
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
      oauthErrorReturn,
    }: {
      configuredOAuthProviders: string[];
      lastUsedOAuthProvider?: string;
      oauthErrorReturn?: string;
    }) => (
      <div
        data-error-return={oauthErrorReturn}
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
import { signUpAction } from "@/core/features/auth/actions";
import { OAuthQueryErrorBanner } from "@/core/features/auth/components/OAuthQueryErrorBanner";
import { OAuthSignInSection } from "@/core/features/auth/components/OAuthSignInSection";

import { SignUpForm } from "./SignUpForm";

const mockUseActionState = jest.mocked(useActionState);
const mockOAuthQueryErrorBanner = jest.mocked(OAuthQueryErrorBanner);
const mockOAuthSignInSection = jest.mocked(OAuthSignInSection);

const submitAction = jest.fn();

function mockSignUpState(
  state: Parameters<typeof mockUseActionState>[1],
  isPending = false,
) {
  mockUseActionState.mockReturnValue([state, submitAction, isPending]);
}

describe("SignUpForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignUpState(null);
  });

  it("renders sign-up fields and passes sign-up OAuth state to the OAuth section", () => {
    render(
      <SignUpForm
        configuredOAuthProviders={["google", "discord"]}
        lastUsedOAuthProvider="google"
      />,
    );

    expect(mockUseActionState).toHaveBeenCalledWith(signUpAction, null);
    expect(
      screen.getByText("Enter your information to create a new account"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(screen.getByLabelText("Password")).toHaveAttribute("minlength", "8");
    expect(
      screen.getByText("Must be at least 8 characters with a letter and number"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Account" })).toBeEnabled();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      routes.signIn,
    );
    expect(screen.getByTestId("oauth-section")).toHaveAttribute(
      "data-provider-count",
      "2",
    );
    expect(screen.getByTestId("oauth-section")).toHaveAttribute(
      "data-last-used-provider",
      "google",
    );
    expect(screen.getByTestId("oauth-section")).toHaveAttribute(
      "data-error-return",
      "sign-up",
    );
    expect(mockOAuthSignInSection).toHaveBeenCalledWith(
      {
        configuredOAuthProviders: ["google", "discord"],
        lastUsedOAuthProvider: "google",
        oauthErrorReturn: "sign-up",
      },
      undefined,
    );
  });

  it("renders returned field values and validation errors", () => {
    mockSignUpState({
      error: "Please correct the highlighted fields.",
      fields: {
        name: "Ada",
        email: "candidate@test.local",
      },
      fieldErrors: {
        name: "Name is required",
        email: "Enter a valid email",
        password: "Password must include a number",
      },
    });

    render(<SignUpForm configuredOAuthProviders={[]} />);

    expect(screen.getByLabelText("Name")).toHaveValue("Ada");
    expect(screen.getByLabelText("Email")).toHaveValue("candidate@test.local");
    expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
    expect(screen.getByText("Password must include a number")).toBeInTheDocument();
    expect(screen.getByTestId("oauth-error")).toHaveTextContent(
      "Please correct the highlighted fields.",
    );
    expect(mockOAuthQueryErrorBanner).toHaveBeenCalledWith(
      { formError: "Please correct the highlighted fields." },
      undefined,
    );
  });

  it("disables controls and shows pending copy while creating an account", () => {
    mockSignUpState(null, true);

    render(<SignUpForm configuredOAuthProviders={[]} />);

    expect(screen.getByLabelText("Name")).toBeDisabled();
    expect(screen.getByLabelText("Email")).toBeDisabled();
    expect(screen.getByLabelText("Password")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Show password" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Creating account..." }),
    ).toBeDisabled();
  });
});
