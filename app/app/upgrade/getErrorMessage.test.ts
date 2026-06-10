import { getErrorMessage, STRIPE_ERROR_MESSAGES } from "./getErrorMessage";

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

  it.each(Object.entries(STRIPE_ERROR_MESSAGES))(
    "returns a corresponding error message when it receives a standard code",
    (code, errorMessage) => {
      expect(getErrorMessage(code)).toBe(errorMessage);
    },
  );

  it("returns a corresponding error message for the first entry in an input array that contains at least one valid item", () => {
    const checkoutFailedErrorCode = "checkout_failed";
    const inputValue = [checkoutFailedErrorCode];
    const expectedReturnValue = STRIPE_ERROR_MESSAGES[checkoutFailedErrorCode];

    const result = getErrorMessage(inputValue);

    expect(result).toBe(expectedReturnValue);
  });

  it("returns a corresponding error message for the first entry in an input array and skips any other items in this array", () => {
    const portalFailedErrorCode = "portal_failed";
    const inputValue = [portalFailedErrorCode, "some_random_text"];
    const expectedReturnValue = STRIPE_ERROR_MESSAGES[portalFailedErrorCode];

    const result = getErrorMessage(inputValue);

    expect(result).toBe(expectedReturnValue);
  });

  it("returns the config fallback message when it receives a non-existing error code string", () => {
    const inputValue = "some_random_text";
    const expectedReturnValue = STRIPE_ERROR_MESSAGES["config"];

    const result = getErrorMessage(inputValue);

    expect(result).toBe(expectedReturnValue);
  });

  it("returns the config fallback message when it receives an array with its first element being a non-existing error code string", () => {
    const inputValue = ["some_random_text"];
    const expectedReturnValue = STRIPE_ERROR_MESSAGES["config"];

    const result = getErrorMessage(inputValue);

    expect(result).toBe(expectedReturnValue);
  });
});
