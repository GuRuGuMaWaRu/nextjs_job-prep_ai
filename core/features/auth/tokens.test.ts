const mockToString = jest.fn();
const mockRandomBytes = jest
  .fn()
  .mockImplementation(() => ({ toString: mockToString }));
const mockDigest = jest.fn();
const mockUpdate = jest.fn().mockImplementation(() => ({ digest: mockDigest }));
const mockCreateHash = jest
  .fn()
  .mockImplementation(() => ({ update: mockUpdate }));

jest.mock("crypto", () => ({
  randomBytes: (...args: unknown[]) => mockRandomBytes(...args),
  randomUUID: jest.fn(),
  createHash: (...args: unknown[]) => mockCreateHash(...args),
}));

import crypto from "crypto";

import { generateSecureToken, generateUserId, hashToken } from "./tokens";

const mockCrypto = jest.mocked(crypto);

describe("token helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateSecureToken", () => {
    it("generates a token with 32 bytes by default", () => {
      const returnValue = "x".repeat(64); // 32 bytes = 64 characters

      mockToString.mockReturnValue(returnValue);

      const result = generateSecureToken();

      expect(mockRandomBytes).toHaveBeenCalledWith(32);
      expect(mockToString).toHaveBeenCalledWith("hex");
      expect(result).toBe(returnValue);
    });

    it("generates a token with the specified number of bytes", () => {
      const returnValue = "x".repeat(32);

      mockToString.mockReturnValue(returnValue);

      const result = generateSecureToken(16);

      expect(mockRandomBytes).toHaveBeenCalledWith(16);
      expect(mockToString).toHaveBeenCalledWith("hex");
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

      expect(mockCreateHash).toHaveBeenCalledWith("sha256");
      expect(mockUpdate).toHaveBeenCalledWith("some_token");
      expect(mockDigest).toHaveBeenCalledWith("hex");
      expect(result).toBe("abc");
    });
  });
});
