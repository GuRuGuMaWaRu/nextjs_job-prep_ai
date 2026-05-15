import { toSafeErrorMeta } from "@/core/lib/toSafeErrorMeta";

describe("toSafeErrorMeta", () => {
  it("keeps the error name while omitting message and stack", () => {
    const error = new TypeError("Sensitive failure details");

    expect(toSafeErrorMeta(error)).toEqual({ name: "TypeError" });
  });

  it("stringifies truthy error codes", () => {
    const error = Object.assign(new Error("Payment failed"), { code: 402 });

    expect(toSafeErrorMeta(error)).toEqual({
      name: "Error",
      code: "402",
    });
  });

  it("omits missing or falsy error codes", () => {
    const error = Object.assign(new Error("Validation failed"), { code: "" });

    expect(toSafeErrorMeta(error)).toEqual({ name: "Error" });
  });

  it("returns UnknownError for non-Error values", () => {
    expect(toSafeErrorMeta("boom")).toEqual({ name: "UnknownError" });
    expect(toSafeErrorMeta(null)).toEqual({ name: "UnknownError" });
  });
});
