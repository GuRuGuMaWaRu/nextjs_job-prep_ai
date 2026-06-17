const mockToString = jest.fn();
const mockDigest = jest.fn();

jest.mock("crypto", () => ({
  randomBytes: () => ({ toString: mockToString }),
  randomUUID: jest.fn(),
  createHash: () => ({ update: () => ({ digest: mockDigest }) }),
}));

import crypto from "crypto";

import { generateSecureToken, generateUserId, hashToken } from "./tokens";

const mockCrypto = jest.mocked(crypto);

describe("token helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateSecureToken", () => {
    it("generates a token with 32 characters length by default", () => {
      const returnValue = "x".repeat(32);

      mockToString.mockReturnValue(returnValue);

      const result = generateSecureToken();

      expect(result).toBe(returnValue);
    });

    it("it generates a token with the provided length", () => {
      const returnValue = "x".repeat(77);

      mockToString.mockReturnValue(returnValue);

      const result = generateSecureToken();

      expect(mockToString).toHaveBeenCalledTimes(1);
      expect(result).toBe(returnValue);
    });
  });

  describe("generateUserId", () => {
    it("returns a generated id", () => {
      mockCrypto.randomUUID.mockReturnValueOnce("abc-123-abc-123-abc");

      const result = generateUserId();

      expect(mockCrypto.randomUUID).toHaveBeenCalledTimes(1);
      expect(result).toBe("abc-123-abc-123-abc");
    });
  });

  describe("hashToken", () => {
    it("returns a hashed token", () => {
      mockDigest.mockReturnValueOnce("abc");

      const result = hashToken("some_token");

      expect(mockDigest).toHaveBeenCalledTimes(1);
      expect(result).toBe("abc");
    });
  });
});
