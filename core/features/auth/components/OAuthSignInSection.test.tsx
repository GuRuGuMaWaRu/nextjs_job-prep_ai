jest.mock("@/core/features/auth/actions", () => ({
  signInWithOAuthAction: jest.fn(),
}));

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { OAuthProvider } from "@/core/drizzle/schema/oauthProviderIds";
import { signInWithOAuthAction } from "@/core/features/auth/actions";

import { OAuthSignInSection } from "./OAuthSignInSection";

const mockSignInWithOAuthAction = jest.mocked(signInWithOAuthAction);

describe("OAuthSignInSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignInWithOAuthAction.mockResolvedValue(undefined as never);
  });

  it("renders nothing when no OAuth providers are configured", () => {
    const { container } = render(
      <OAuthSignInSection configuredOAuthProviders={[]} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders configured providers and marks the last used provider", () => {
    render(
      <OAuthSignInSection
        configuredOAuthProviders={["google", "github"]}
        lastUsedOAuthProvider="github"
      />,
    );

    expect(screen.getByRole("button", { name: "Google" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Github Last used" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Or continue with email")).toBeInTheDocument();
  });

  it("starts OAuth with the configured error return target", async () => {
    const user = userEvent.setup();

    render(
      <OAuthSignInSection
        configuredOAuthProviders={["discord"]}
        oauthErrorReturn="sign-up"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Discord" }));

    expect(mockSignInWithOAuthAction).toHaveBeenCalledWith("discord", {
      errorReturn: "sign-up",
    });
  });

  it("throws for an unsupported provider value at runtime", () => {
    const unsupportedProvider = "linkedin" as OAuthProvider;

    expect(() =>
      render(
        <OAuthSignInSection configuredOAuthProviders={[unsupportedProvider]} />,
      ),
    ).toThrow("Unexpected: linkedin");
  });
});
