import { getErrorMessage } from "./getErrorMessage";

describe("getErrorMessage", () => {
  describe("when no error is present", () => {
    it.each([undefined, "", [], [""]])("returns null for %p", (input) => {
      expect(getErrorMessage(input)).toBeNull();
    });
  });

  describe("when code is known", () => {
    it.each([
      ["unauthorized", "Please sign in to continue."],
      [
        "stripe_not_configured",
        "Billing is not available right now. Please try again later.",
      ],
      ["config", "Something went wrong. Please try again later."],
      [
        "no_subscription",
        "No active subscription found. You are already on the Free plan.",
      ],
      [
        "cancel_failed",
        "Failed to cancel subscription. Try again or use Manage subscription.",
      ],
      ["user_not_found", "We couldn't find your account. Please try again."],
      ["already_pro", "You already have an active Pro subscription."],
      [
        "existing_subscription",
        "You have an existing subscription. Use Manage subscription on this page to update payment or cancel.",
      ],
      ["checkout_failed", "Failed to start checkout. Please try again."],
      ["no_customer", "No billing customer found. Upgrade to Pro first."],
      ["portal_failed", "Failed to open billing portal. Please try again."],
    ])("maps %s to the correct message", (code, errorMessage) => {
      expect(getErrorMessage(code)).toBe(errorMessage);
    });
  });

  describe("when code is unknown", () => {
    it.each(["some_random_text", ["some_random_text"]])(
      "falls back to the config message for %p",
      (input) => {
        expect(getErrorMessage(input)).toBe(
          "Something went wrong. Please try again later.",
        );
      },
    );
  });

  it("uses the first array element when present", () => {
    expect(getErrorMessage(["checkout_failed"])).toBe(
      "Failed to start checkout. Please try again.",
    );
  });

  it("ignores additional array elements", () => {
    expect(getErrorMessage(["portal_failed", "some_random_text"])).toBe(
      "Failed to open billing portal. Please try again.",
    );
  });

  it("returns the config fallback message when it receives an array with its first element being a non-existing error code string", () => {
    expect(getErrorMessage(["some_random_text"])).toBe(
      "Something went wrong. Please try again later.",
    );
  });
});
