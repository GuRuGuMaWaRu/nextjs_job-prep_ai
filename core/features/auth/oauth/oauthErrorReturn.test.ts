import { routes } from "@/core/data/routes";
import { oauthErrorReturnToPath } from "@/core/features/auth/oauth/oauthErrorReturn";

describe("oauthErrorReturnToPath", () => {
  it("maps sign-up to routes.signUp", () => {
    expect(oauthErrorReturnToPath("sign-up")).toBe(routes.signUp);
  });

  it("maps sign-in to routes.signIn", () => {
    expect(oauthErrorReturnToPath("sign-in")).toBe(routes.signIn);
  });

  it("defaults to sign-in for undefined", () => {
    expect(oauthErrorReturnToPath(undefined)).toBe(routes.signIn);
  });

  it("defaults to sign-in for tampered or unknown values", () => {
    expect(oauthErrorReturnToPath("https://evil.example")).toBe(routes.signIn);
    expect(oauthErrorReturnToPath("sign-up ")).toBe(routes.signIn);
    expect(oauthErrorReturnToPath("")).toBe(routes.signIn);
  });
});
