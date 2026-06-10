import { getErrorMessage } from "./getErrorMessage";

describe("getErrorMessage", () => {
  it("returns null when it receives undefined", () => {
    const inputValue = undefined;
    const expectedReturnValue = null;

    const result = getErrorMessage(inputValue);

    expect(result).toBe(expectedReturnValue);
  });

  it("returns null when it receives an empty string", () => {
    const inputValue = "";
    const expectedReturnValue = null;

    const result = getErrorMessage(inputValue);

    expect(result).toBe(expectedReturnValue);
  });

  it("returns null when it receives an empty array", () => {
    const inputValue: Array<string> = [];
    const expectedReturnValue = null;

    const result = getErrorMessage(inputValue);

    expect(result).toBe(expectedReturnValue);
  });

  it("returns null when it receives an array with just one empty string element", () => {
    const inputValue = [""];
    const expectedReturnValue = null;

    const result = getErrorMessage(inputValue);

    expect(result).toBe(expectedReturnValue);
  });

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
  ])(
    "returns a corresponding error message when it receives a standard code",
    (code, errorMessage) => {
      expect(getErrorMessage(code)).toBe(errorMessage);
    },
  );

  it("returns a corresponding error message for the first entry in an input array that contains at least one valid item", () => {
    const checkoutFailedErrorCode = "checkout_failed";
    const inputValue = [checkoutFailedErrorCode];
    const expectedReturnValue = "Failed to start checkout. Please try again.";

    const result = getErrorMessage(inputValue);

    expect(result).toBe(expectedReturnValue);
  });

  it("returns a corresponding error message for the first entry in an input array and skips any other items in this array", () => {
    const portalFailedErrorCode = "portal_failed";
    const inputValue = [portalFailedErrorCode, "some_random_text"];
    const expectedReturnValue =
      "Failed to open billing portal. Please try again.";

    const result = getErrorMessage(inputValue);

    expect(result).toBe(expectedReturnValue);
  });

  it("returns the config fallback message when it receives a non-existing error code string", () => {
    const inputValue = "some_random_text";
    const expectedReturnValue = "Something went wrong. Please try again later.";

    const result = getErrorMessage(inputValue);

    expect(result).toBe(expectedReturnValue);
  });

  it("returns the config fallback message when it receives an array with its first element being a non-existing error code string", () => {
    const inputValue = ["some_random_text"];
    const expectedReturnValue = "Something went wrong. Please try again later.";

    const result = getErrorMessage(inputValue);

    expect(result).toBe(expectedReturnValue);
  });
});
