import { hashPassword, normalizePassword, verifyPassword } from "../password";

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
