import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "@/core/features/auth/constants";

import {
  hashPassword,
  normalizePassword,
  validatePassword,
  verifyPassword,
} from "./password";

describe("normalizePassword", () => {
  it("normalizes canonically equivalent Unicode passwords to NFC", () => {
    const decomposed = "Cafe\u0301123";
    const composed = "Caf\u00e9123";

    expect(normalizePassword(decomposed)).toBe(composed);
  });
});

describe("password hashing", () => {
  it("hashes normalized passwords and verifies canonically equivalent input", async () => {
    const hash = await hashPassword("Cafe\u0301123");

    expect(hash).not.toBe("Cafe\u0301123");
    await expect(verifyPassword("Caf\u00e9123", hash)).resolves.toBe(true);
  });

  it("rejects non-matching passwords", async () => {
    const hash = await hashPassword("Correct123");

    await expect(verifyPassword("Wrong123", hash)).resolves.toBe(false);
  });
});

describe("validatePassword", () => {
  it("accepts passwords within length limits that include letters and numbers", () => {
    expect(validatePassword("abc12345")).toEqual({ isValid: true });
  });

  it("rejects passwords shorter than the minimum length", () => {
    expect(validatePassword("a1".repeat(MIN_PASSWORD_LENGTH / 2 - 1))).toEqual({
      isValid: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    });
  });

  it("rejects passwords longer than the maximum length after normalization", () => {
    const password = `A1${"x".repeat(MAX_PASSWORD_LENGTH - 1)}`;

    expect(validatePassword(password)).toEqual({
      isValid: false,
      error: `Password must be less than ${MAX_PASSWORD_LENGTH} characters`,
    });
  });

  it("requires at least one ASCII letter and one number", () => {
    expect(validatePassword("abcdefgh")).toEqual({
      isValid: false,
      error: "Password must contain at least one letter and one number",
    });

    expect(validatePassword("12345678")).toEqual({
      isValid: false,
      error: "Password must contain at least one letter and one number",
    });
  });
});
