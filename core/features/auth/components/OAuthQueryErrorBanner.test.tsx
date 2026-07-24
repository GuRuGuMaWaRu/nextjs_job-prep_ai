jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

import { render, screen } from "@testing-library/react";
import { useSearchParams } from "next/navigation";

import { OAuthQueryErrorBanner } from "./OAuthQueryErrorBanner";

const mockUseSearchParams = jest.mocked(useSearchParams);

function mockOAuthError(oauthError?: string) {
  mockUseSearchParams.mockReturnValue({
    get: jest.fn((key: string) => (key === "oauthError" ? oauthError : null)),
  } as unknown as ReturnType<typeof useSearchParams>);
}

describe("OAuthQueryErrorBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOAuthError(undefined);
  });

  it("renders nothing without form or OAuth errors", () => {
    const { container } = render(<OAuthQueryErrorBanner />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the OAuth query error message", () => {
    mockOAuthError("oauth_missing_email");

    render(<OAuthQueryErrorBanner />);

    expect(
      screen.getByText(
        "Sign-in did not return an email. Add or verify an email with that provider, or sign in another way.",
      ),
    ).toBeInTheDocument();
  });

  it("renders the unverified local account conflict message", () => {
    mockOAuthError("oauth_email_in_use");

    render(<OAuthQueryErrorBanner />);

    expect(
      screen.getByText(
        "An account with this email already exists. Sign in with your email and password instead.",
      ),
    ).toBeInTheDocument();
  });

  it("prefers a form error over an OAuth query error", () => {
    mockOAuthError("oauth_failed");

    render(<OAuthQueryErrorBanner formError="Invalid credentials" />);

    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    expect(
      screen.queryByText("Failed to connect. Please try again."),
    ).not.toBeInTheDocument();
  });
});
